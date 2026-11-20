// Log diagnostik kit (PELAN J6a, PH§5.4 N4): bentuk peristiwa yang dibenarkan, pengesah, baris log, saiz tetingkap rakaman.
// Tulen: tiada DOM, tiada SDK, tiada fs. Log menyimpan kod, angka dan mesej ralat RINGKAS (PH§5.6 L1: nama + kod + baris pertama,
// dipotong ikut had config, laluan rumah pengguna diganti `~`, kunci ditapis). TIADA kunci, TIADA imej, TIADA bingkai kamera.

/** Peristiwa yang renderer boleh hantar ke log. Medan lain dibuang oleh `sahkanDiag`. */
export type PeristiwaDiag =
  | { jenis: "kamera"; label: string; lebar: number; tinggi: number; fps: number }
  | { jenis: "sesi"; fasa: "mula" | "tamat"; sumber: string }
  | { jenis: "status"; kod: number }
  | { jenis: "pengesahan"; kod: number }
  | { jenis: "ralat"; kod: number; boleh_ulang: boolean; mesej: string | null }
  | { jenis: "metrik_pertama"; ms: number }
  /** getUserMedia gagal: `nama` DOMException (NotAllowedError, NotReadableError, NotFoundError, OverconstrainedError…). */
  | { jenis: "kamera_gagal"; nama: string; mesej: string }
  /** Sesi ukur tidak dapat dimula (`SesiUkur.cipta`): kategori ralat + mesej ringkas. */
  | { jenis: "mula_gagal"; sebab: string; mesej: string | null }
  /** Ralat renderer tidak ditangkap (`error`, `unhandledrejection`); had bilangan setiap proses di main. */
  | { jenis: "ralat_ui"; asal: "error" | "janji"; mesej: string }
  | { jenis: "sdk_sedia"; ok: boolean; sebab: string | null; ralat: string | null }
  | { jenis: "tetingkap"; lebar: number; tinggi: number };

/** Maklumat kepala log (satu kali setiap proses app). */
export interface KepalaLog {
  versi: string;
  komit_kit: string;
  os: string;
  os_versi: string;
  arch: string;
  electron: string;
  sumber: string;
  /** Versi SDK dari config (`sdk.versi`). */
  sdk: string;
  /** Izin kamera sistem (Windows/macOS: granted, denied, restricted, not-determined…); platform lain = "n/a". */
  izin_kamera: string;
}

/** Had panjang teks diagnostik (`config/app.json` `log`). */
export interface HadDiag {
  teks_maks: number;
  mesej_maks: number;
}

/** Potong ke `maks` aksara; dipotong = elipsis dalam had itu. */
export function potong(s: string, maks: number): string {
  if (s.length <= maks) return s;
  return maks <= 1 ? s.slice(0, Math.max(0, maks)) : `${s.slice(0, maks - 1)}…`;
}

/**
 * Ganti laluan folder rumah pengguna dengan `~`: rumah yang diberi (cth `os.homedir()`), kemudian corak umum Windows
 * (`C:\Users\<nama>`, juga dalam `\\?\C:\…` dan JSON berganda), macOS (`/Users/<nama>`) dan Linux (`/home/<nama>`, `/root`).
 * Nama pengguna Windows boleh mengandungi ruang: dipadan hingga pemisah laluan seterusnya.
 */
export function gantiRumah(s: string, rumah: ReadonlyArray<string | null | undefined> = []): string {
  let h = s;
  for (const r of rumah) if (r && r.length > 3) h = h.split(r).join("~");
  return h
    .replace(/[A-Za-z]:[\\/]+(?:Users|Documents and Settings)[\\/]+[^\\/"'<>|\r\n]+/gi, "~")
    .replace(/\/(?:home|Users)\/[^/\s"'<>|]+/g, "~")
    .replace(/\/root(?=[/\s"']|$)/g, "~");
}

/**
 * Ringkasan satu ralat untuk log dan baris Butiran: `Nama [kod]: baris pertama mesej`, laluan rumah → `~`, rahsia ditapis,
 * dipotong ke `maks`. Ralat bukan objek (rentetan, nombor) = baris pertama teksnya.
 */
export function ringkasRalat(
  e: unknown,
  maks: number,
  rumah: ReadonlyArray<string | null | undefined> = [],
  rahsia: ReadonlyArray<string | null | undefined> = [],
): string {
  let teks: string;
  if (e && typeof e === "object") {
    const o = e as { name?: unknown; code?: unknown; message?: unknown };
    const nama = typeof o.name === "string" && o.name ? o.name : "Error";
    const kod = typeof o.code === "string" || typeof o.code === "number" ? ` [${o.code}]` : "";
    const mesej = typeof o.message === "string" ? o.message : "";
    const baris = mesej.split(/\r?\n/)[0]!.trim();
    teks = baris ? `${nama}${kod}: ${baris}` : `${nama}${kod}`;
  } else teks = String(e ?? "").split(/\r?\n/)[0]!.trim();
  return potong(tapisRahsia(gantiRumah(teks, rumah), rahsia), maks);
}

const nom = (x: unknown): number | null => (typeof x === "number" && Number.isFinite(x) ? Math.round(x * 1000) / 1000 : null);
const teks = (x: unknown, maks: number): string | null => (typeof x === "string" ? x.slice(0, maks) : null);

/**
 * Sahkan peristiwa dari renderer (data tidak dipercayai). null = jenis/medan tidak sah, tidak ditulis. Medan mesej dibersihkan
 * semula di sini (satu baris, laluan rumah → `~`, dipotong `mesej_maks`): renderer tidak tahu folder rumah sebenar.
 */
export function sahkanDiag(x: unknown, had: HadDiag, rumah: ReadonlyArray<string | null | undefined> = []): PeristiwaDiag | null {
  if (!x || typeof x !== "object") return null;
  const o = x as Record<string, unknown>;
  const teksMaks = had.teks_maks;
  const mesej = (m: unknown): string | null => (typeof m === "string" ? ringkasRalat(m, had.mesej_maks, rumah) : null);
  switch (o.jenis) {
    case "kamera": {
      const label = teks(o.label, teksMaks);
      const [lebar, tinggi, fps] = [nom(o.lebar), nom(o.tinggi), nom(o.fps)];
      return label === null || lebar === null || tinggi === null || fps === null ? null : { jenis: "kamera", label, lebar, tinggi, fps };
    }
    case "sesi": {
      const sumber = teks(o.sumber, teksMaks);
      return (o.fasa === "mula" || o.fasa === "tamat") && sumber !== null ? { jenis: "sesi", fasa: o.fasa, sumber } : null;
    }
    case "status":
    case "pengesahan": {
      const kod = nom(o.kod);
      return kod === null ? null : { jenis: o.jenis, kod };
    }
    case "ralat": {
      const kod = nom(o.kod);
      return kod === null ? null : { jenis: "ralat", kod, boleh_ulang: o.boleh_ulang === true, mesej: mesej(o.mesej) };
    }
    case "kamera_gagal": {
      const nama = teks(o.nama, teksMaks);
      const m = mesej(o.mesej);
      return nama === null || m === null ? null : { jenis: "kamera_gagal", nama, mesej: m };
    }
    case "mula_gagal": {
      const sebab = teks(o.sebab, teksMaks);
      return sebab === null ? null : { jenis: "mula_gagal", sebab, mesej: mesej(o.mesej) };
    }
    case "ralat_ui": {
      const m = mesej(o.mesej);
      return (o.asal === "error" || o.asal === "janji") && m !== null ? { jenis: "ralat_ui", asal: o.asal, mesej: m } : null;
    }
    case "metrik_pertama": {
      const ms = nom(o.ms);
      return ms === null ? null : { jenis: "metrik_pertama", ms };
    }
    default:
      return null; // sdk_sedia dan tetingkap ditulis oleh main sahaja
  }
}

/** Ganti setiap rahsia (≥ 8 aksara) dalam teks dengan penanda. Lapisan kedua: bentuk peristiwa sudah tiada medan kunci. */
export function tapisRahsia(baris: string, rahsia: ReadonlyArray<string | null | undefined>): string {
  let hasil = baris;
  for (const r of rahsia) if (r && r.length >= 8) hasil = hasil.split(r).join("[redacted]");
  return hasil;
}

/** Satu baris log JSON: masa ISO + peristiwa (atau kepala). */
export function barisLog(masa: Date, isi: PeristiwaDiag | ({ jenis: "app" } & KepalaLog), rahsia: ReadonlyArray<string | null | undefined>): string {
  return tapisRahsia(JSON.stringify({ masa: masa.toISOString(), ...isi }), rahsia) + "\n";
}

/** Nama fail log harian (tarikh tempatan): `<awalan>YYYY-MM-DD.log`. */
export function namaFailLog(awalan: string, masa: Date): string {
  const d = (n: number) => String(n).padStart(2, "0");
  return `${awalan}${masa.getFullYear()}-${d(masa.getMonth() + 1)}-${d(masa.getDate())}.log`;
}

/**
 * Laluan peristiwa berulang: `validationStatus` tiba berpuluh kali sesaat dengan kod sama. Hanya PERUBAHAN kod ditulis
 * (setiap kod yang dilihat tetap direkod sekurang-kurangnya sekali setiap perubahan).
 */
export class TapisUlang {
  private readonly akhir = new Map<string, number>();
  lulus(jenis: string, kod: number): boolean {
    if (this.akhir.get(jenis) === kod) return false;
    this.akhir.set(jenis, kod);
    return true;
  }
}

export interface Saiz {
  lebar: number;
  tinggi: number;
}

/**
 * Saiz kandungan tetingkap rakaman: sasaran (1600×900) bila muat dalam ruang yang ada; jika tidak, dikecilkan dengan nisbah
 * yang sama (16:9 kekal) dan tidak kurang daripada saiz minimum tetingkap.
 */
export function saizRakam(sasaran: Saiz, ruang: Saiz, minimum: Saiz): Saiz {
  const k = Math.min(1, ruang.lebar / sasaran.lebar, ruang.tinggi / sasaran.tinggi);
  return {
    lebar: Math.max(minimum.lebar, Math.floor(sasaran.lebar * k)),
    tinggi: Math.max(minimum.tinggi, Math.floor(sasaran.tinggi * k)),
  };
}
