// Video demo pipeline (P8a/P8, PH§7.2): pure helpers for scripts/video/sunting.mjs. Parses the scene table of the video
// script, builds EN captions (.srt), maps fixture tap times onto the edited timeline, synthesises tap clicks and checks the
// final loudness and length. No ffmpeg, no files here: the script does the I/O.

export interface KonfigJadual {
  tajuk_lajur_masa: string;
  tajuk_lajur_narasi: string;
}
export interface KonfigKapsyen {
  aksara_maks: number;
  tempoh_min_s: number;
  jarak_hujung_s: number;
}
export interface HadVideo {
  tempoh_maks_s: number;
  lufs_min: number;
  lufs_maks: number;
  puncak_maks_dbtp: number;
  toleransi_babak_s: number;
}

/** Satu baris jadual babak: masa dalam saat dari awal video; narasi null = babak senyap (cth kad akhir). */
export interface Babak {
  indeks: number;
  mula: number;
  akhir: number;
  narasi: string | null;
}
export interface Kapsyen {
  mula: number;
  akhir: number;
  teks: string;
}
/** Peta potong: setiap babak diambil dari satu sumber bermula pada `mula` saat, atau kad akhir yang dijana. */
export type PotongBabak = { sumber: string; mula: number } | { kad: true };
export interface PetaPotong {
  sumber: Record<string, string>;
  babak: PotongBabak[];
  ketukan?: { fixture: string; sumber: string; sumber_mula_us: number };
}

const TBD = /<<TBD ([^>]+)>>/g;

/** "1:56" → 116. */
export function huraiMasa(s: string): number {
  const m = /^(\d+):([0-5]\d)$/.exec(s.trim());
  if (!m) throw new Error(`masa tidak sah: ${s}`);
  return Number(m[1]) * 60 + Number(m[2]);
}

const sel = (baris: string): string[] =>
  baris
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((x) => x.trim());

/** Jadual babak markdown → senarai babak bersambung dari 0 s. Ralat bila jadual tiada, masa berlubang atau bertindih. */
export function huraiBabak(md: string, k: KonfigJadual): Babak[] {
  const baris = md.split(/\r?\n/);
  const i0 = baris.findIndex((b) => b.trim().startsWith("|") && sel(b).includes(k.tajuk_lajur_masa) && sel(b).includes(k.tajuk_lajur_narasi));
  if (i0 < 0) throw new Error("jadual babak tiada");
  const tajuk = sel(baris[i0]!);
  const cMasa = tajuk.indexOf(k.tajuk_lajur_masa);
  const cNarasi = tajuk.indexOf(k.tajuk_lajur_narasi);
  const hasil: Babak[] = [];
  for (let i = i0 + 2; i < baris.length && baris[i]!.trim().startsWith("|"); i++) {
    const c = sel(baris[i]!);
    const [a, b] = (c[cMasa] ?? "").split(/[–-]/);
    if (a === undefined || b === undefined) throw new Error(`masa babak tidak sah: ${c[cMasa]}`);
    const petik = /"([^"]+)"/.exec(c[cNarasi] ?? "");
    hasil.push({ indeks: hasil.length, mula: huraiMasa(a), akhir: huraiMasa(b), narasi: petik ? petik[1]!.trim() : null });
  }
  if (!hasil.length) throw new Error("jadual babak kosong");
  hasil.forEach((x, i) => {
    const jangka = i === 0 ? 0 : hasil[i - 1]!.akhir;
    if (x.mula !== jangka || x.akhir <= x.mula) throw new Error(`babak ${i + 1} tidak bersambung (${x.mula}–${x.akhir}, jangka mula ${jangka})`);
  });
  return hasil;
}

/** Nama slot `<<TBD x>>` yang masih ada dalam narasi. */
export function slotTbd(babak: Babak[]): string[] {
  return babak.flatMap((b) => [...(b.narasi ?? "").matchAll(TBD)].map((m) => m[1]!));
}

/** Isi slot dari `nilai`; slot tanpa nilai: `ganti(nama)` bila diberi (pemegang tempat), selain itu dibiar. */
export function isiSlot(babak: Babak[], nilai: Record<string, string>, ganti?: (nama: string) => string): Babak[] {
  return babak.map((b) => ({
    ...b,
    narasi: b.narasi === null ? null : b.narasi.replace(TBD, (s, n: string) => nilai[n] ?? (ganti ? ganti(n) : s)),
  }));
}

/** Pecah teks kepada pil kapsyen ≤ maks aksara; hujung ayat (. ? !) sentiasa menamatkan pil. Satu perkataan terlalu panjang = pil sendiri. */
export function pecahKapsyen(teks: string, maks: number): string[] {
  const pil: string[] = [];
  let kini = "";
  for (const w of teks.split(/\s+/).filter(Boolean)) {
    if (kini && (kini + " " + w).length > maks) {
      pil.push(kini);
      kini = w;
    } else kini = kini ? `${kini} ${w}` : w;
    if (/[.?!]["”]?$/.test(kini)) {
      pil.push(kini);
      kini = "";
    }
  }
  if (kini) pil.push(kini);
  return pil;
}

/** Kapsyen setiap babak dibahagi ikut panjang aksara dalam tetingkap babak (hujung dikosongkan `jarak_hujung_s`). */
export function jadualKapsyen(babak: Babak[], k: KonfigKapsyen): Kapsyen[] {
  const hasil: Kapsyen[] = [];
  for (const b of babak) {
    if (!b.narasi) continue;
    const pil = pecahKapsyen(b.narasi, k.aksara_maks);
    const ruang = Math.max(b.akhir - b.mula - k.jarak_hujung_s, k.tempoh_min_s);
    const jumlah = pil.reduce((s, p) => s + p.length, 0);
    let t = b.mula;
    for (const p of pil) {
      const d = Math.max((ruang * p.length) / jumlah, k.tempoh_min_s);
      const akhir = Math.min(t + d, b.akhir);
      hasil.push({ mula: t, akhir, teks: p });
      t = akhir;
    }
  }
  return hasil;
}

const masaSrt = (s: number): string => {
  const ms = Math.round(s * 1000);
  const p = (n: number, w = 2) => String(n).padStart(w, "0");
  return `${p(Math.floor(ms / 3_600_000))}:${p(Math.floor(ms / 60_000) % 60)}:${p(Math.floor(ms / 1000) % 60)},${p(ms % 1000, 3)}`;
};

export function srt(kapsyen: Kapsyen[]): string {
  return kapsyen.map((c, i) => `${i + 1}\n${masaSrt(c.mula)} --> ${masaSrt(c.akhir)}\n${c.teks}\n`).join("\n");
}

/** Semak peta potong lawan babak: satu entri setiap babak, sumber bernama wujud, kad hanya babak terakhir. */
export function semakPeta(babak: Babak[], peta: PetaPotong): string[] {
  const ralat: string[] = [];
  if (peta.babak.length !== babak.length) ralat.push(`peta ada ${peta.babak.length} babak, skrip ada ${babak.length}`);
  peta.babak.forEach((p, i) => {
    if ("kad" in p) {
      if (i !== babak.length - 1) ralat.push(`babak ${i + 1}: kad hanya untuk babak terakhir`);
    } else if (!(p.sumber in peta.sumber)) ralat.push(`babak ${i + 1}: sumber '${p.sumber}' tiada`);
    else if (!(p.mula >= 0)) ralat.push(`babak ${i + 1}: mula mesti ≥ 0`);
  });
  if (peta.ketukan && !(peta.ketukan.sumber in peta.sumber)) ralat.push(`ketukan: sumber '${peta.ketukan.sumber}' tiada`);
  return ralat;
}

/** Cap masa ketukan (µs epoch) → saat pada garis masa video suntingan, hanya bila ketukan jatuh dalam babak yang dipotong dari sumber itu. */
export function petaKetukan(babak: Babak[], peta: PetaPotong, ketukanUs: number[]): number[] {
  const k = peta.ketukan;
  if (!k) return [];
  const hasil: number[] = [];
  for (const us of ketukanUs) {
    const tSumber = (us - k.sumber_mula_us) / 1e6;
    babak.forEach((b, i) => {
      const p = peta.babak[i];
      if (!p || "kad" in p || p.sumber !== k.sumber) return;
      const d = tSumber - p.mula;
      if (d >= 0 && d < b.akhir - b.mula) hasil.push(b.mula + d);
    });
  }
  return hasil.sort((a, b) => a - b);
}

/** Klik pendek (sinus mereput) pada setiap masa; mono, julat −1..1. */
export function bunyiKetukan(masa: number[], tempohS: number, kadar: number, k: { frekuensi_hz: number; tempoh_ms: number; amplitud: number }): Float32Array {
  const out = new Float32Array(Math.ceil(tempohS * kadar));
  const n = Math.round((k.tempoh_ms / 1000) * kadar);
  for (const t of masa) {
    const i0 = Math.round(t * kadar);
    for (let j = 0; j < n && i0 + j < out.length; j++) {
      out[i0 + j]! += k.amplitud * Math.exp((-5 * j) / n) * Math.sin((2 * Math.PI * k.frekuensi_hz * j) / kadar);
    }
  }
  return out;
}

/** Pemegang tempat narasi (P8a sahaja): nada harmonik dimodulasi kadar suku kata dalam tetingkap setiap kapsyen. */
export function narasiTiruan(kapsyen: Kapsyen[], tempohS: number, kadar: number, k: { frekuensi_hz: number[]; suku_kata_hz: number; amplitud: number }): Float32Array {
  const out = new Float32Array(Math.ceil(tempohS * kadar));
  for (const c of kapsyen) {
    for (let i = Math.round(c.mula * kadar); i < Math.min(Math.round(c.akhir * kadar), out.length); i++) {
      const t = i / kadar;
      const am = 0.5 - 0.5 * Math.cos(2 * Math.PI * k.suku_kata_hz * (t - c.mula));
      let s = 0;
      for (const f of k.frekuensi_hz) s += Math.sin(2 * Math.PI * f * t) / k.frekuensi_hz.length;
      out[i]! += k.amplitud * am * s;
    }
  }
  return out;
}

/** Float32 mono → WAV PCM 16-bit (diklip ke −1..1). */
export function wav(sampel: Float32Array, kadar: number): Buffer {
  const b = Buffer.alloc(44 + sampel.length * 2);
  b.write("RIFF", 0);
  b.writeUInt32LE(36 + sampel.length * 2, 4);
  b.write("WAVEfmt ", 8);
  b.writeUInt32LE(16, 16);
  b.writeUInt16LE(1, 20);
  b.writeUInt16LE(1, 22);
  b.writeUInt32LE(kadar, 24);
  b.writeUInt32LE(kadar * 2, 28);
  b.writeUInt16LE(2, 32);
  b.writeUInt16LE(16, 34);
  b.write("data", 36);
  b.writeUInt32LE(sampel.length * 2, 40);
  sampel.forEach((v, i) => b.writeInt16LE(Math.round(Math.max(-1, Math.min(1, v)) * 32767), 44 + i * 2));
  return b;
}

/** Ringkasan `ebur128=peak=true` ffmpeg (stderr) → kenyaringan bersepadu (LUFS) dan puncak benar (dBTP). */
export function huraiEbur128(stderr: string): { lufs: number; tp: number } {
  const ringkas = stderr.slice(stderr.lastIndexOf("Summary:"));
  const lufs = /I:\s+(-?[\d.]+|-inf) LUFS/.exec(ringkas);
  const tp = /True peak:\s+Peak:\s+(-?[\d.]+|-inf) dBFS/.exec(ringkas);
  if (!lufs || !tp) throw new Error("ringkasan ebur128 tiada");
  const n = (s: string) => (s === "-inf" ? -Infinity : Number(s));
  return { lufs: n(lufs[1]!), tp: n(tp[1]!) };
}

/** Blok JSON terakhir `loudnorm=print_format=json` (laluan 1). */
export function huraiLoudnorm(stderr: string): Record<string, string> {
  const m = stderr.match(/\{[^{}]*"input_i"[^{}]*\}/g);
  if (!m) throw new Error("JSON loudnorm tiada");
  return JSON.parse(m[m.length - 1]!) as Record<string, string>;
}

/** Ukuran akhir lawan had PH§7.1 / SKRIP-VIDEO: tempoh, julat LUFS, puncak benar. Kosong = lulus. */
export function semakUkuran(u: { tempoh: number; lufs: number; tp: number }, h: HadVideo): string[] {
  const r: string[] = [];
  if (!(u.tempoh <= h.tempoh_maks_s + h.toleransi_babak_s)) r.push(`tempoh ${u.tempoh.toFixed(2)} s > ${h.tempoh_maks_s} s`);
  if (!(u.lufs >= h.lufs_min && u.lufs <= h.lufs_maks)) r.push(`kenyaringan ${u.lufs} LUFS di luar ${h.lufs_min}..${h.lufs_maks}`);
  if (!(u.tp <= h.puncak_maks_dbtp)) r.push(`puncak benar ${u.tp} dBTP > ${h.puncak_maks_dbtp}`);
  return r;
}

/** Nilai token warna CSS (`--nama: #hex;`) dari gaya app, supaya video memakai palet yang sama. */
export function tokenWarna(css: string, token: string): string {
  const m = new RegExp(`${token.replace(/[-]/g, "\\-")}:\\s*(#[0-9a-fA-F]{6})\\s*;`).exec(css);
  if (!m) throw new Error(`token ${token} tiada`);
  return m[1]!;
}
