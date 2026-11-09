// Simpan kad keputusan PNG (PRD §4.2 "Simpan kad PNG", tempatan sahaja). Tiada Electron di sini (diuji vitest):
// main memberi folder (Gambar pengguna / Degup). Renderer menghantar bait; main mengesahkan tandatangan PNG dan had saiz,
// menamakan fail sendiri (renderer tidak memilih laluan).
import { existsSync, mkdirSync, renameSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const TANDATANGAN_PNG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

export type HasilKad = { ok: true; nama: string; laluan: string } | { ok: false; sebab: "bukan_png" | "terlalu_besar" | "tulis" };

export function pngSah(b: Uint8Array): boolean {
  return b.length > TANDATANGAN_PNG.length && TANDATANGAN_PNG.every((x, i) => b[i] === x);
}

/** Nama fail dari masa tempatan: <awalan>YYYYMMDD-HHMMSS[-n].png; `-n` bila nama sudah wujud (dua simpanan dalam saat sama). */
export function namaKad(awalan: string, d: Date, wujud: (nama: string) => boolean = () => false): string {
  const p = (x: number) => String(x).padStart(2, "0");
  const asas = `${awalan}${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
  let nama = `${asas}.png`;
  for (let n = 2; wujud(nama); n++) nama = `${asas}-${n}.png`;
  return nama;
}

export function simpanKad(folder: string, awalan: string, bait: unknown, maksBait: number, kini: Date): HasilKad {
  if (!(bait instanceof Uint8Array) || !pngSah(bait)) return { ok: false, sebab: "bukan_png" };
  if (bait.length > maksBait) return { ok: false, sebab: "terlalu_besar" };
  const nama = namaKad(awalan, kini, (x) => existsSync(join(folder, x)));
  const laluan = join(folder, nama);
  try {
    mkdirSync(folder, { recursive: true });
    const tmp = join(folder, `.${nama}.tmp`);
    writeFileSync(tmp, bait);
    renameSync(tmp, laluan);
  } catch {
    return { ok: false, sebab: "tulis" };
  }
  return { ok: true, nama, laluan };
}
