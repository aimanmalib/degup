// Log diagnostik kit (PELAN J6a, PH§5.4 N4): bentuk peristiwa yang dibenarkan, pengesah, baris log, saiz tetingkap rakaman.
// Tulen: tiada DOM, tiada SDK, tiada fs. Log menyimpan kod dan angka sahaja: TIADA kunci, TIADA imej, TIADA mesej ralat SDK.

/** Peristiwa yang renderer boleh hantar ke log. Medan lain dibuang oleh `sahkanDiag`. */
export type PeristiwaDiag =
  | { jenis: "kamera"; label: string; lebar: number; tinggi: number; fps: number }
  | { jenis: "sesi"; fasa: "mula" | "tamat"; sumber: string }
  | { jenis: "status"; kod: number }
  | { jenis: "pengesahan"; kod: number }
  | { jenis: "ralat"; kod: number; boleh_ulang: boolean }
  | { jenis: "metrik_pertama"; ms: number }
  | { jenis: "sdk_sedia"; ok: boolean; sebab: string | null }
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
}

const nom = (x: unknown): number | null => (typeof x === "number" && Number.isFinite(x) ? Math.round(x * 1000) / 1000 : null);
const teks = (x: unknown, maks: number): string | null => (typeof x === "string" ? x.slice(0, maks) : null);

/** Sahkan peristiwa dari renderer (data tidak dipercayai). null = jenis/medan tidak sah, tidak ditulis. */
export function sahkanDiag(x: unknown, teksMaks: number): PeristiwaDiag | null {
  if (!x || typeof x !== "object") return null;
  const o = x as Record<string, unknown>;
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
      return kod === null ? null : { jenis: "ralat", kod, boleh_ulang: o.boleh_ulang === true };
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
