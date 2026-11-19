// Tetapan pengguna (PRD §4.6, §4.7): lalai, bahasa permulaan, gabung simpanan. Tulen: dikongsi main (fail) dan halaman sim pelayar (localStorage).
import type { Tetapan } from "../preload/api.js";

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
