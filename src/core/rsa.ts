// Bend maths: beat-to-beat gaps (IBI) grouped by breathing cycle, then the median swing per cycle (peak to trough of a fitted sine by default).
// Uses beats from beats.ts and the SDK breathing waveform. It reports numbers only, no good or bad label.
// LENTUR (PRD §4.5): sela degupan (IBI) mengikut kitaran nafas; ringkasan = median (IBI maks − IBI min) setiap kitaran.
// Tulen: tiada DOM, tiada SDK. Masa µs epoch. Tiada pentafsiran baik/buruk di sini atau di UI.
import type { Degupan } from "./beats.js";
import { degupanSah } from "./score.js";

export interface KonfigLentur {
  tarik_s: number;
  hembus_s: number;
  min_degupan_kitaran: number;
  /** "sinus" = puncak-ke-lembah sinus muat atas IBI kitaran (lalai, D7); "maks_min" = IBI maks − min mentah. */
  julat_kaedah: "sinus" | "maks_min";
  nafas_kadar_hz: number;
  nafas_licin_s: number;
  nafas_sela_min_s: number;
  nafas_stabil_min: number;
  nafas_kitaran_min: number;
}

export interface Ibi {
  /** Masa degupan kedua (µs). */
  t: number;
  ms: number;
}

export interface Kitaran {
  mula: number;
  akhir: number;
}

export interface SampelNafas {
  t: number;
  v: number;
  stabil: boolean;
}

export interface HasilKitaran extends Kitaran {
  nDegupan: number;
  /** IBI maks − min (ms); null bila < `min_degupan_kitaran` degupan sah. */
  julatMs: number | null;
}

export interface HasilLentur {
  ibi: Ibi[];
  sumberKitaran: "panduan" | "jejak";
  kitaran: HasilKitaran[];
  /** Median julat kitaran yang sah (ms, bulat); null bila tiada kitaran sah. */
  ringkasanMs: number | null;
  /** Nisbah nadi-nafas SDK terkini yang stabil, satu perpuluhan; null bila tiada. */
  prq: number | null;
}

const US = 1e6;

function median(xs: readonly number[]): number | null {
  if (xs.length === 0) return null;
  const s = [...xs].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m]! : (s[m - 1]! + s[m]!) / 2;
}

/** IBI dari pasangan degupan sah berturut-turut. */
export function kiraIbi(
  degupan: readonly Degupan[],
  kualitiPada: (t: number) => number | null,
  kualitiSaatMin: number,
): Ibi[] {
  const out: Ibi[] = [];
  for (let i = 0; i + 1 < degupan.length; i++) {
    const a = degupan[i]!;
    const b = degupan[i + 1]!;
    if (degupanSah(a, kualitiPada, kualitiSaatMin) && degupanSah(b, kualitiPada, kualitiSaatMin))
      out.push({ t: b.t, ms: (b.t - a.t) / 1000 });
  }
  return out;
}

/** Kitaran penuh dari panduan nafas (tarik + hembus) bermula `mula`. */
export function kitaranPanduan(mula: number, akhir: number, kfg: KonfigLentur): Kitaran[] {
  const tempoh = (kfg.tarik_s + kfg.hembus_s) * US;
  const out: Kitaran[] = [];
  for (let t = mula; t + tempoh <= akhir; t += tempoh) out.push({ mula: t, akhir: t + tempoh });
  return out;
}

/** Fasa panduan pada masa t: tarik dahulu, kemudian hembus (lorek jalur IBI hidup). */
export function fasaPanduan(t: number, mula: number, kfg: KonfigLentur): "tarik" | "hembus" {
  const tempoh = (kfg.tarik_s + kfg.hembus_s) * US;
  const dalam = (((t - mula) % tempoh) + tempoh) % tempoh;
  return dalam < kfg.tarik_s * US ? "tarik" : "hembus";
}

/**
 * Jejak nafas atas dilicinkan: sampel semula seragam (`nafas_kadar_hz`), purata bergerak berpusat (`nafas_licin_s`), tolak min.
 * Null bila sampel terlalu sedikit atau pecahan stabil < `nafas_stabil_min`. Dikongsi kitaran (puncak) dan lorek fasa (cerun).
 */
export function licinNafas(
  nafas: readonly SampelNafas[],
  mula: number,
  akhir: number,
  kfg: KonfigLentur,
): { t: number[]; y: number[] } | null {
  const s = nafas.filter((x) => x.t >= mula && x.t < akhir).sort((a, b) => a.t - b.t);
  if (s.length < 2) return null;
  if (s.filter((x) => x.stabil).length / s.length < kfg.nafas_stabil_min) return null;

  const langkah = US / kfg.nafas_kadar_hz;
  const gt: number[] = [];
  const gv: number[] = [];
  let j = 0;
  for (let t = s[0]!.t; t <= s[s.length - 1]!.t; t += langkah) {
    while (j + 1 < s.length - 1 && s[j + 1]!.t < t) j++;
    const a = s[j]!;
    const b = s[Math.min(j + 1, s.length - 1)]!;
    const w = b.t === a.t ? 0 : (t - a.t) / (b.t - a.t);
    gt.push(t);
    gv.push(a.v + Math.min(1, Math.max(0, w)) * (b.v - a.v));
  }

  const separuh = Math.max(0, Math.round((kfg.nafas_licin_s * kfg.nafas_kadar_hz) / 2));
  const licin = gv.map((_, i) => {
    let jum = 0;
    let n = 0;
    for (let k = Math.max(0, i - separuh); k <= Math.min(gv.length - 1, i + separuh); k++) {
      jum += gv[k]!;
      n++;
    }
    return jum / n;
  });
  const min = licin.reduce((a, b) => a + b, 0) / licin.length;
  return { t: gt, y: licin.map((v) => v - min) };
}

/**
 * Kitaran dari jejak nafas atas (puncak ke puncak) atas jejak dilicinkan (`licinNafas`): puncak > 0 dengan sela ≥
 * `nafas_sela_min_s`. Null bila jejak tidak cukup stabil atau kitaran terlalu sedikit.
 */
export function kitaranJejak(nafas: readonly SampelNafas[], mula: number, akhir: number, kfg: KonfigLentur): Kitaran[] | null {
  const l = licinNafas(nafas, mula, akhir, kfg);
  if (!l) return null;
  const { t: gt, y } = l;
  const selaMin = kfg.nafas_sela_min_s * US;
  const puncak: number[] = [];
  for (let i = 1; i + 1 < y.length; i++) {
    if (!(y[i]! > 0 && y[i]! >= y[i - 1]! && y[i]! > y[i + 1]!)) continue;
    const akhirP = puncak[puncak.length - 1];
    if (akhirP !== undefined && gt[i]! - gt[akhirP]! < selaMin) {
      if (y[i]! > y[akhirP]!) puncak[puncak.length - 1] = i;
      continue;
    }
    puncak.push(i);
  }
  const kitaran: Kitaran[] = [];
  for (let i = 0; i + 1 < puncak.length; i++) kitaran.push({ mula: gt[puncak[i]!]!, akhir: gt[puncak[i + 1]!]! });
  return kitaran.length >= kfg.nafas_kitaran_min ? kitaran : null;
}

/**
 * Puncak-ke-lembah gelombang sinus (frekuensi = 1/tempoh kitaran) yang dimuat kuasa dua terkecil atas IBI dalam kitaran:
 * IBI ≈ a + b·cos(ωt) + c·sin(ωt) → 2·√(b² + c²). Hingar masa degupan menaikkan maks − min mentah secara sistematik (D7).
 */
export function julatSinus(ibi: readonly Ibi[], k: Kitaran): number {
  const w = (2 * Math.PI) / (k.akhir - k.mula);
  // Persamaan normal 3×3 untuk [1, cos, sin].
  const A = [0, 0, 0, 0, 0, 0, 0, 0, 0];
  const y = [0, 0, 0];
  for (const x of ibi) {
    const tengah = x.t - (x.ms * 1000) / 2 - k.mula;
    const f = [1, Math.cos(w * tengah), Math.sin(w * tengah)];
    for (let i = 0; i < 3; i++) {
      y[i]! += f[i]! * x.ms;
      for (let j = 0; j < 3; j++) A[i * 3 + j]! += f[i]! * f[j]!;
    }
  }
  const p = selesai3(A, y);
  return p ? 2 * Math.hypot(p[1]!, p[2]!) : Math.max(...ibi.map((x) => x.ms)) - Math.min(...ibi.map((x) => x.ms));
}

/** Penghapusan Gauss dengan pangsi separa; null bila singular. */
function selesai3(A: number[], y: number[]): number[] | null {
  const M = [0, 1, 2].map((i) => [A[i * 3]!, A[i * 3 + 1]!, A[i * 3 + 2]!, y[i]!]);
  for (let c = 0; c < 3; c++) {
    let p = c;
    for (let r = c + 1; r < 3; r++) if (Math.abs(M[r]![c]!) > Math.abs(M[p]![c]!)) p = r;
    if (Math.abs(M[p]![c]!) < 1e-9) return null;
    [M[c], M[p]] = [M[p]!, M[c]!];
    for (let r = 0; r < 3; r++) {
      if (r === c) continue;
      const f = M[r]![c]! / M[c]![c]!;
      for (let k = c; k < 4; k++) M[r]![k]! -= f * M[c]![k]!;
    }
  }
  return M.map((r, i) => r[3]! / r[i]!);
}

/** Julat IBI setiap kitaran: degupan sah dalam [mula, akhir); IBI yang kedua-dua degupannya dalam kitaran. */
export function julatKitaran(
  ibi: readonly Ibi[],
  kitaran: readonly Kitaran[],
  minDegupan: number,
  kaedah: KonfigLentur["julat_kaedah"] = "maks_min",
): HasilKitaran[] {
  return kitaran.map((k) => {
    const dalam = ibi.filter((x) => x.t - x.ms * 1000 >= k.mula && x.t < k.akhir);
    const degupanUnik = new Set<number>();
    for (const x of dalam) degupanUnik.add(Math.round(x.t)).add(Math.round(x.t - x.ms * 1000));
    const nDegupan = degupanUnik.size;
    const julatMs =
      nDegupan < minDegupan
        ? null
        : kaedah === "sinus"
          ? julatSinus(dalam, k)
          : Math.max(...dalam.map((x) => x.ms)) - Math.min(...dalam.map((x) => x.ms));
    return { ...k, nDegupan, julatMs };
  });
}

/** PRQ SDK terkini yang stabil, dibulatkan satu perpuluhan. */
export function ringkasPrq(nilai: readonly { v: number; stabil: boolean }[]): number | null {
  for (let i = nilai.length - 1; i >= 0; i--) {
    const x = nilai[i]!;
    if (x.stabil && Number.isFinite(x.v)) return Math.round(x.v * 10) / 10;
  }
  return null;
}

export interface InputLentur {
  degupan: readonly Degupan[];
  kualitiPada: (t: number) => number | null;
  kualitiSaatMin: number;
  /** Tetingkap LENTUR [mula, akhir) µs; panduan nafas bermula pada `mula`. */
  mula: number;
  akhir: number;
  nafas: readonly SampelNafas[];
  prq: readonly { v: number; stabil: boolean }[];
}

export function kiraLentur(input: InputLentur, kfg: KonfigLentur): HasilLentur {
  const { mula, akhir } = input;
  const degupan = input.degupan.filter((d) => d.t >= mula && d.t < akhir);
  const ibi = kiraIbi(degupan, input.kualitiPada, input.kualitiSaatMin);
  const jejak = kitaranJejak(input.nafas, mula, akhir, kfg);
  const kitaran = julatKitaran(ibi, jejak ?? kitaranPanduan(mula, akhir, kfg), kfg.min_degupan_kitaran, kfg.julat_kaedah);
  const med = median(kitaran.flatMap((k) => (k.julatMs === null ? [] : [k.julatMs])));
  return {
    ibi,
    sumberKitaran: jejak ? "jejak" : "panduan",
    kitaran,
    ringkasanMs: med === null ? null : Math.round(med),
    prq: ringkasPrq(input.prq),
  };
}
