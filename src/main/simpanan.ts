// Simpanan tempatan proses main (PRD §4.6 perkara 4, §4.7): tetapan, kunci API terenkripsi, senarai fail ditulis sesi ini.
// Tiada Electron di sini: penyulit disuntik (safeStorage dalam app, palsu dalam ujian) supaya modul boleh diuji vitest.
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync, renameSync } from "node:fs";
import { join } from "node:path";
import type { Tetapan } from "../preload/api.js";

export interface Penyulit {
  boleh(): boolean;
  sulit(teks: string): Buffer;
  buka(b: Buffer): string;
}

export const FAIL_TETAPAN = "tetapan.json";
export const FAIL_KUNCI = "kunci.bin";
/** Fail yang Degup mungkin tulis dalam folder datanya; "Padam semua data Degup" membuang semuanya. */
export const FAIL_DEGUP = [FAIL_TETAPAN, FAIL_KUNCI] as const;

export function tetapanLalai(bahasaLalai: string, bunyiLalai: boolean): Tetapan {
  return { bahasa: bahasaLalai, kamera: null, bunyi: bunyiLalai, sumber: "live", fixture: null };
}

/**
 * Bahasa permulaan bila pengguna belum memilih (PH§5.2 J2.5). `lalai` = kod bahasa, atau "auto" = locale OS yang bermula dengan
 * salah satu kod dalam `bahasa` (cth "ms-MY" → "ms"); tiada padanan = `undur`.
 */
export function pilihBahasa(lalai: string, locale: string, bahasa: readonly string[], undur: string): string {
  if (lalai !== "auto") return bahasa.includes(lalai) ? lalai : undur;
  const l = locale.toLowerCase();
  return bahasa.find((b) => l === b || l.startsWith(`${b}-`) || l.startsWith(`${b}_`)) ?? undur;
}

/** Gabung tetapan simpanan dengan lalai; medan berjenis salah dibuang (fail rosak tidak menjatuhkan app). */
export function gabungTetapan(lalai: Tetapan, x: unknown, bahasa: readonly string[]): Tetapan {
  const t = { ...lalai };
  if (typeof x !== "object" || x === null) return t;
  const o = x as Record<string, unknown>;
  if (typeof o.bahasa === "string" && bahasa.includes(o.bahasa)) t.bahasa = o.bahasa;
  if (typeof o.kamera === "string" || o.kamera === null) t.kamera = o.kamera as string | null;
  if (typeof o.bunyi === "boolean") t.bunyi = o.bunyi;
  if (o.sumber === "live" || o.sumber === "replay") t.sumber = o.sumber;
  if (typeof o.fixture === "string" || o.fixture === null) t.fixture = o.fixture as string | null;
  return t;
}

export class Simpanan {
  private readonly ditulis = new Set<string>();

  constructor(
    private readonly folder: string,
    private readonly lalai: Tetapan,
    private readonly bahasa: readonly string[],
    private readonly penyulit: Penyulit,
  ) {}

  private laluan(nama: string): string {
    return join(this.folder, nama);
  }

  private tulis(nama: string, data: string | Buffer): void {
    mkdirSync(this.folder, { recursive: true, mode: 0o700 });
    const tmp = this.laluan(`.${nama}.tmp`);
    writeFileSync(tmp, data, { mode: 0o600 });
    renameSync(tmp, this.laluan(nama));
    this.ditulis.add(nama);
  }

  bacaTetapan(): Tetapan {
    try {
      return gabungTetapan(this.lalai, JSON.parse(readFileSync(this.laluan(FAIL_TETAPAN), "utf8")), this.bahasa);
    } catch {
      return { ...this.lalai };
    }
  }

  simpanTetapan(ubah: Partial<Tetapan>): Tetapan {
    const t = gabungTetapan(this.lalai, { ...this.bacaTetapan(), ...ubah }, this.bahasa);
    this.tulis(FAIL_TETAPAN, JSON.stringify(t, null, 2));
    return t;
  }

  kunciAda(): boolean {
    return existsSync(this.laluan(FAIL_KUNCI));
  }

  /** Simpan kunci API terenkripsi. Tiada penyulit = tolak (kunci tidak pernah ditulis teks biasa). */
  simpanKunci(kunci: string): { ok: true } | { ok: false; sebab: "kosong" | "storan" } {
    const k = kunci.trim();
    if (!k) return { ok: false, sebab: "kosong" };
    if (!this.penyulit.boleh()) return { ok: false, sebab: "storan" };
    this.tulis(FAIL_KUNCI, this.penyulit.sulit(k));
    return { ok: true };
  }

  /** Kunci untuk SDK (P4a: dihantar ke renderer hanya bila sumber live dimulakan). */
  bacaKunci(): string | null {
    try {
      return this.penyulit.buka(readFileSync(this.laluan(FAIL_KUNCI)));
    } catch {
      return null;
    }
  }

  padamKunci(): void {
    rmSync(this.laluan(FAIL_KUNCI), { force: true });
  }

  /** "Padam semua data Degup": buang setiap fail Degup dalam folder data (bukan folder Electron lain). */
  padamSemua(): string[] {
    const dibuang: string[] = [];
    for (const nama of FAIL_DEGUP) {
      if (existsSync(this.laluan(nama))) {
        rmSync(this.laluan(nama), { force: true });
        dibuang.push(nama);
      }
    }
    this.ditulis.clear();
    return dibuang;
  }

  /** Fail yang Degup tulis di LUAR folder data (kad PNG pengguna): dicatat untuk panel Data, tidak dipadam "Padam semua". */
  catat(laluan: string): void {
    this.ditulis.add(laluan);
  }

  /** Fail yang Degup tulis dalam sesi ini (panel Data §4.6: egress yang diukur, bukan dakwaan). */
  failDitulis(): string[] {
    return [...this.ditulis].sort();
  }
}
