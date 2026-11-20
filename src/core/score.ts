// Sync score for Feel: the phase of each tap inside its beat cycle, mean resultant length R, and a Rayleigh test for chance.
// Input is the beats from beats.ts and tap times on the same microsecond clock. Score bands come from config; a round whose
// taps are too few or cover too little of the round gets the coverage band instead of an R/p band (rhythm alone can fake R).
// Skor RASA (PRD §4.4): fasa ketukan dalam kitaran degupan, panjang resultan min R, ujian Rayleigh, jalur dari config.
// Tulen: tiada DOM, tiada SDK. Masa dalam µs epoch (asas sama untuk degupan SDK dan ketukan).
import type { Degupan } from "./beats.js";

export interface JalurKonfig {
  id: string;
  r_min?: number;
  p_bawah?: number;
}

/** Syarat liputan (K1, D29): skor yang cukup data tetapi ketukannya sedikit atau sempit = jalur `jalur`, bukan jalur R/p. */
export interface KonfigLiputan {
  ketukan_min: number;
  rentang_min_s: number;
  jalur: string;
}

export interface KonfigSkor {
  n_min: number;
  liputan: KonfigLiputan;
  kualiti_min: number;
  kualiti_saat_min: number;
  ayat_separuh_kitaran: number;
  jalur: JalurKonfig[];
}

export interface InputSkor {
  degupan: readonly Degupan[];
  /** Cap masa ketukan (µs epoch). */
  ketukan: readonly number[];
  /** Tetingkap RASA [mula, akhir) µs. */
  mula: number;
  akhir: number;
  /** Pecahan sampel berkeyakinan ≥ ambang dalam tetingkap (PengesanDegupan.kualitiAntara); null = tiada sampel. */
  kualitiTetingkap: number | null;
  /** Kualiti saat yang mengandungi masa t (µs); null = tiada sampel. */
  kualitiPada: (t: number) => number | null;
}

export type SebabTakCukup = "ketukan" | "kualiti";

export interface HasilSkor {
  /** Semua degupan dalam tetingkap (paparan "Kamera nampak N degupan"). */
  N: number;
  /** Semua ketukan dalam tetingkap ("Kau ketuk n"). */
  n: number;
  /** Degupan sah dan ketukan sah yang dipakai untuk skor. */
  nDegupanSah: number;
  nKetukanSah: number;
  /** Fasa setiap ketukan sah (radian, [0, 2π)). */
  fasa: number[];
  kualiti: number | null;
  cukup: boolean;
  sebab: SebabTakCukup[];
  R: number;
  z: number;
  p: number;
  /** bulat(R × 100). */
  skor: number;
  /** id jalur dari config; null bila tak cukup data. */
  jalur: string | null;
  /** Fasa min ditukar ke ms selepas degupan (median IBI sah); null jika tiada ketukan sah. */
  sesaranMs: number | null;
  /** Ketukan dalam ± `ayat_separuh_kitaran` kitaran dari fasa min, daripada 10 (ayat statistik bahasa biasa). */
  samaDaripada10: number | null;
  /** Jangkaan `samaDaripada10` bila ketukan rawak seragam: 10 × 2 × `ayat_separuh_kitaran` (ayat "kebetulan memberi kira-kira …"). */
  peluangDaripada10: number;
  /** Ketukan sah minimum (config `n_min`; ayat sebab ketukan). */
  nMin: number;
  /** Saat antara ketukan sah pertama dan terakhir (syarat liputan). */
  rentangS: number;
  /** Ketukan sah ≥ `liputan.ketukan_min` DAN rentang ≥ `liputan.rentang_min_s`. */
  liputanCukup: boolean;
}

const DUA_PI = 2 * Math.PI;

/** Degupan sah §4.4: bukan ragu, bukan jurang, bukan bising, kualiti saatnya ≥ ambang. */
export function degupanSah(d: Degupan, kualitiPada: (t: number) => number | null, kualitiSaatMin: number): boolean {
  if (d.ragu || d.jurang || d.bising) return false;
  const q = kualitiPada(d.t);
  return q !== null && q >= kualitiSaatMin;
}

/** Fasa φ = 2π (t − b_i)/(b_{i+1} − b_i) untuk ketukan yang jatuh antara dua degupan sah berturut-turut. */
export function fasaKetukan(
  sah: readonly boolean[],
  degupan: readonly Degupan[],
  ketukan: readonly number[],
): { fasa: number[]; ibiUs: number[]; masa: number[] } {
  const fasa: number[] = [];
  const ibiUs: number[] = [];
  const masa: number[] = [];
  const tersusun = [...ketukan].sort((a, b) => a - b);
  let j = 0;
  for (let i = 0; i + 1 < degupan.length; i++) {
    const a = degupan[i]!;
    const b = degupan[i + 1]!;
    while (j < tersusun.length && tersusun[j]! < a.t) j++;
    if (!sah[i] || !sah[i + 1]) continue;
    const sela = b.t - a.t;
    ibiUs.push(sela);
    let k = j;
    while (k < tersusun.length && tersusun[k]! < b.t) {
      fasa.push((DUA_PI * (tersusun[k]! - a.t)) / sela);
      masa.push(tersusun[k]!);
      k++;
    }
  }
  return { fasa, ibiUs, masa };
}

/** Statistik bulat: R (panjang resultan min), sudut min dalam [0, 2π). */
export function resultan(fasa: readonly number[]): { R: number; sudut: number } {
  if (fasa.length === 0) return { R: 0, sudut: 0 };
  let c = 0;
  let s = 0;
  for (const f of fasa) {
    c += Math.cos(f);
    s += Math.sin(f);
  }
  const R = Math.hypot(c, s) / fasa.length;
  const sudut = (Math.atan2(s, c) + DUA_PI) % DUA_PI;
  return { R, sudut };
}

/** Ujian Rayleigh PRD §4.4: z = nR², p ≈ exp(−z). */
export function rayleigh(n: number, R: number): { z: number; p: number } {
  const z = n * R * R;
  return { z, p: n === 0 ? 1 : Math.min(1, Math.exp(-z)) };
}

/** Jalur padanan pertama (D4): setiap syarat yang ada mesti dipenuhi. */
/**
 * Skor yang boleh DIPAPAR (L2): null bila tak cukup data ATAU liputan gagal (jalur `terlalu_sedikit`). Nombor R×100 daripada
 * segelintir ketukan rapat hampir sentiasa tinggi; memaparkannya di atas pil "terlalu sedikit" bercanggah dengan pil itu.
 */
export function skorDipapar(h: Pick<HasilSkor, "cukup" | "liputanCukup" | "skor">): number | null {
  return h.cukup && h.liputanCukup ? h.skor : null;
}

export function pilihJalur(jalur: readonly JalurKonfig[], R: number, p: number): string {
  for (const j of jalur) {
    if (j.r_min !== undefined && R < j.r_min) continue;
    if (j.p_bawah !== undefined && !(p < j.p_bawah)) continue;
    return j.id;
  }
  throw new Error("config.rasa.jalur: tiada jalur lalai tanpa syarat");
}

function median(xs: readonly number[]): number | null {
  if (xs.length === 0) return null;
  const s = [...xs].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m]! : (s[m - 1]! + s[m]!) / 2;
}

/** Beza sudut terpendek dalam [0, π]. */
function bezaSudut(a: number, b: number): number {
  const d = Math.abs(a - b) % DUA_PI;
  return d > Math.PI ? DUA_PI - d : d;
}

export function kiraSkor(input: InputSkor, kfg: KonfigSkor): HasilSkor {
  const { mula, akhir } = input;
  const dalam = (t: number) => t >= mula && t < akhir;
  const degupan = input.degupan.filter((d) => dalam(d.t));
  const ketukan = input.ketukan.filter(dalam);
  const sah = degupan.map((d) => degupanSah(d, input.kualitiPada, kfg.kualiti_saat_min));
  const { fasa, ibiUs, masa } = fasaKetukan(sah, degupan, ketukan);
  const { R, sudut } = resultan(fasa);
  const { z, p } = rayleigh(fasa.length, R);

  const sebab: SebabTakCukup[] = [];
  if (fasa.length < kfg.n_min) sebab.push("ketukan");
  if (input.kualitiTetingkap === null || input.kualitiTetingkap < kfg.kualiti_min) sebab.push("kualiti");
  const cukup = sebab.length === 0;
  // `masa` tersusun menaik (fasaKetukan berjalan atas ketukan tersusun).
  const rentangS = masa.length > 1 ? (masa[masa.length - 1]! - masa[0]!) / 1e6 : 0;
  const liputanCukup = fasa.length >= kfg.liputan.ketukan_min && rentangS >= kfg.liputan.rentang_min_s;

  const ibiMed = median(ibiUs);
  const sesaranMs = fasa.length > 0 && ibiMed !== null ? Math.round(((sudut / DUA_PI) * ibiMed) / 1000) : null;
  const lebar = kfg.ayat_separuh_kitaran * DUA_PI;
  const samaDaripada10 =
    fasa.length > 0 ? Math.round((10 * fasa.filter((f) => bezaSudut(f, sudut) <= lebar).length) / fasa.length) : null;

  return {
    N: degupan.length,
    n: ketukan.length,
    nDegupanSah: sah.filter(Boolean).length,
    nKetukanSah: fasa.length,
    fasa,
    kualiti: input.kualitiTetingkap,
    cukup,
    sebab,
    R,
    z,
    p,
    skor: Math.round(R * 100),
    jalur: !cukup ? null : liputanCukup ? pilihJalur(kfg.jalur, R, p) : kfg.liputan.jalur,
    sesaranMs,
    samaDaripada10,
    peluangDaripada10: 10 * 2 * kfg.ayat_separuh_kitaran,
    nMin: kfg.n_min,
    rentangS,
    liputanCukup,
  };
}
