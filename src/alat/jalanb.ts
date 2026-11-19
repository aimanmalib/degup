// Jalan B (PH§5.5 K3, PH§5.4 N6): video telefon pemilik menjadi kamera app sebenar; ketukan jarinya di meja (trek audio video
// yang sama) dimainkan semula ke skrin RASA pada saat ia dibuat. Modul ini tulen (tiada ffmpeg, tiada Electron): pengesan
// permulaan bunyi, rancangan ketukan lawan babak, dan bahan pemegang tempat raptai. Skrip: scripts/jalanb/*.mjs.

export interface KonfigKetukan {
  kadar_sampel: number;
  tetingkap_ms: number;
  langkah_ms: number;
  lantai_s: number;
  lantai_persentil: number;
  nisbah_lantai_db: number;
  pecahan_puncak: number;
  naik_ms: number;
  naik_db: number;
  refraktori_ms: number;
  /** [dari, hingga] saat; tiada = seluruh klip. */
  julat_s?: number[];
}

export interface HasilKesan {
  /** Saat permulaan setiap ketukan, diukur dari sampel pertama PCM. */
  ketukan_s: number[];
  /** RMS rujukan puncak (dalam julat) dan median lantai hingar: untuk log, bukan keputusan. */
  puncak: number;
  lantai_median: number;
}

function persentil(nilai: Float64Array | number[], p: number): number {
  if (nilai.length === 0) return 0;
  const s = Float64Array.from(nilai).sort();
  return s[Math.min(s.length - 1, Math.max(0, Math.floor(p * (s.length - 1))))]!;
}

/**
 * Permulaan ketukan dari PCM mono (−1..1). RMS bergolek setiap `langkah_ms`; lantai hingar = persentil RMS dalam ±lantai_s/2
 * (dikira setiap blok ¼ saat); ambang = maks(lantai × nisbah, pecahan × puncak dalam julat). Ketukan = bingkai pertama yang RMS-nya melepasi ambang DAN
 * melonjak ≥ naik_db berbanding naik_ms sebelumnya (letusan hingar naik perlahan), selepas tempoh refraktori; masanya diperhalus ke sampel pertama yang amplitudnya melepasi ambang.
 */
export function kesanKetukan(x: Float32Array, k: KonfigKetukan): HasilKesan {
  const sr = k.kadar_sampel;
  const hop = Math.max(1, Math.round((sr * k.langkah_ms) / 1000));
  const win = Math.max(hop, Math.round((sr * k.tetingkap_ms) / 1000));
  const n = Math.max(0, Math.floor((x.length - win) / hop) + 1);
  const rms = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    let s = 0;
    for (let j = i * hop; j < i * hop + win; j++) s += x[j]! * x[j]!;
    rms[i] = Math.sqrt(s / win);
  }
  const masa = (i: number) => (i * hop) / sr;
  const dari = k.julat_s?.[0] ?? 0;
  const hingga = k.julat_s?.[1] ?? Infinity;
  const dalam = (i: number) => masa(i) >= dari && masa(i) <= hingga;

  const blok = Math.max(1, Math.round(0.25 / (hop / sr)));
  const separuh = Math.max(1, Math.round(k.lantai_s / 2 / (hop / sr)));
  const lantaiBlok: number[] = [];
  for (let b = 0; b * blok < n; b++) {
    const pusat = b * blok + Math.floor(blok / 2);
    lantaiBlok.push(persentil(rms.subarray(Math.max(0, pusat - separuh), Math.min(n, pusat + separuh)), k.lantai_persentil));
  }
  const nisbah = 10 ** (k.nisbah_lantai_db / 20);
  const rmsDalam: number[] = [];
  for (let i = 0; i < n; i++) if (dalam(i)) rmsDalam.push(rms[i]!);
  const puncak = rmsDalam.length ? Math.max(...rmsDalam) : 0;
  const ambang = (i: number) => Math.max(lantaiBlok[Math.floor(i / blok)]! * nisbah, k.pecahan_puncak * puncak, 1e-6);

  const lompat = Math.max(1, Math.round((sr * k.naik_ms) / 1000 / hop));
  const naik = 10 ** (k.naik_db / 20);
  const ketukan_s: number[] = [];
  let akhir = -Infinity;
  const calon = (i: number) => i >= lompat && rms[i]! >= ambang(i) && rms[i]! >= rms[i - lompat]! * naik;
  for (let i = 1; i < n; i++) {
    const a = ambang(i);
    if (!dalam(i) || !calon(i) || calon(i - 1)) continue;
    let mula = i * hop;
    for (let j = Math.max(0, (i - 1) * hop); j < Math.min(x.length, i * hop + win); j++)
      if (Math.abs(x[j]!) >= a) {
        mula = j;
        break;
      }
    const t = mula / sr;
    if ((t - akhir) * 1000 < k.refraktori_ms) continue;
    ketukan_s.push(t);
    akhir = t;
  }
  return { ketukan_s, puncak, lantai_median: persentil(lantaiBlok, 0.5) };
}

/** Ketukan yang jatuh dalam tetingkap RASA sebenar [mula, tamat) saat video; selebihnya dikira, tidak dimainkan. */
export function rancangKetukan(ketukan_s: number[], rasaMulaS: number, rasaTamatS: number) {
  const main = ketukan_s.filter((t) => t >= rasaMulaS && t < rasaTamatS);
  return { main, awal: ketukan_s.filter((t) => t < rasaMulaS).length, lewat: ketukan_s.filter((t) => t >= rasaTamatS).length };
}

/** Padankan ketukan dikesan dengan ketukan diketahui (satu-satu, jiran terdekat dalam `hadS`). */
export function padanKetukan(diketahui: number[], dikesan: number[], hadS: number) {
  const guna = new Set<number>();
  const ralat_ms: number[] = [];
  let terlepas = 0;
  for (const t of diketahui) {
    let terbaik = -1;
    for (let j = 0; j < dikesan.length; j++)
      if (!guna.has(j) && Math.abs(dikesan[j]! - t) <= hadS && (terbaik < 0 || Math.abs(dikesan[j]! - t) < Math.abs(dikesan[terbaik]! - t)))
        terbaik = j;
    if (terbaik < 0) terlepas++;
    else {
      guna.add(terbaik);
      ralat_ms.push((dikesan[terbaik]! - t) * 1000);
    }
  }
  const mutlak = ralat_ms.map(Math.abs);
  return { padan: ralat_ms.length, terlepas, palsu: dikesan.length - guna.size, ralat_maks_ms: mutlak.length ? Math.max(...mutlak) : 0, ralat_ms };
}

export interface KonfigPemegangTempat {
  tempoh_s: number;
  ketukan_mula_s: number;
  ketukan_akhir_s: number;
  selang_asas_s: number;
  selang_goyang_s: number;
  ketukan_hz: number;
  ketukan_amp: number;
  ketukan_reput: number;
  ketukan_tempoh_s: number;
  hingar_amp: number;
  letus_amp: number;
  letus_mula_s: number[];
  letus_tempoh_s: number;
}

/** Masa ketukan pemegang tempat: selang asas + goyang berpecahan emas (tidak berkala sempurna), dibundar ke milisaat. */
export function masaPemegangTempat(k: KonfigPemegangTempat): number[] {
  const t: number[] = [];
  for (let i = 0, s = k.ketukan_mula_s; s <= k.ketukan_akhir_s; i++) {
    t.push(Math.round(s * 1000) / 1000);
    s += k.selang_asas_s + (((i * 0.6180339887) % 1) - 0.5) * 2 * k.selang_goyang_s;
  }
  return t;
}

/** Satu ketukan: sinus reput dalam [t, t + tempoh), sifar di luar (`if` malas: tiada exp() meletup sebelum t). */
function sebutanKetukan(k: KonfigPemegangTempat, t: number): string {
  return `if(between(t,${t},${(t + k.ketukan_tempoh_s).toFixed(3)}),sin(2*PI*${k.ketukan_hz}*(t-${t}))*exp(-${k.ketukan_reput}*(t-${t})),0)`;
}

/** Pokok carian seimbang atas masa ketukan: setiap sampel menilai O(log n) cabang `if(lt(t,…))`, bukan n sebutan. */
function pokokKetukan(k: KonfigPemegangTempat, t: number[], lo: number, hi: number): string {
  if (hi - lo === 1) return sebutanKetukan(k, t[lo]!);
  const mid = (lo + hi) >> 1;
  return `if(lt(t,${t[mid]}),${pokokKetukan(k, t, lo, mid)},${pokokKetukan(k, t, mid, hi)})`;
}

/** Graf penapis ffmpeg (input lavfi) untuk trek audio pemegang tempat: hingar putih + letusan hingar coklat + ketukan sinus reput. */
export function grafAudioPemegangTempat(k: KonfigPemegangTempat, ketukan: number[], sr: number): string {
  const t = [...ketukan].sort((a, b) => a - b);
  const ungkapan = t.length ? pokokKetukan(k, t, 0, t.length) : "0";
  const letus = k.letus_mula_s.map((m) => `between(t,${m},${m + k.letus_tempoh_s})`).join("+") || "0";
  return [
    `aevalsrc='${k.ketukan_amp}*${ungkapan}':s=${sr}:d=${k.tempoh_s}[tk]`,
    `anoisesrc=c=white:a=${k.hingar_amp}:r=${sr}:d=${k.tempoh_s}:seed=7[hp]`,
    `anoisesrc=c=brown:a=${k.letus_amp}:r=${sr}:d=${k.tempoh_s}:seed=11,volume='${letus}':eval=frame[hl]`,
    `[tk][hp][hl]amix=inputs=3:normalize=0[a]`,
  ].join(";");
}

/** Argumen ffmpeg: video apa-apa → fail kamera palsu MJPEG (tiada audio) pada saiz/fps config. */
export function argMjpeg(masuk: string, keluar: string, k: { lebar: number; tinggi: number; fps: number; kualiti_mjpeg: number }): string[] {
  const vf = `scale=${k.lebar}:${k.tinggi}:force_original_aspect_ratio=decrease,pad=${k.lebar}:${k.tinggi}:(ow-iw)/2:(oh-ih)/2,fps=${k.fps}`;
  return ["-hide_banner", "-loglevel", "error", "-y", "-i", masuk, "-an", "-vf", vf, "-c:v", "mjpeg", "-q:v", String(k.kualiti_mjpeg), "-f", "mjpeg", keluar];
}
