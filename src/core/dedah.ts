// Pendedahan RASA (PRD §4.2, §4.4): garis masa (degupan, ketukan, jalur kualiti) sebagai kedudukan relatif 0..1, dan
// ayat bahasa biasa sebagai kunci i18n + nilai. Tulen: tiada DOM, tiada SDK. Masa µs epoch.
import type { Degupan } from "./beats.js";
import { degupanSah, type HasilSkor, type KonfigLiputan } from "./score.js";

const US = 1e6;

export interface InputGaris {
  mula: number;
  akhir: number;
  degupan: readonly Degupan[];
  ketukan: readonly number[];
  /** Saat epoch → pecahan sampel berkeyakinan (PengesanDegupan.kualitiSetiapSaat). */
  kualitiSaat: ReadonlyMap<number, number>;
  kualitiSaatMin: number;
}

export interface GarisMasa {
  /** x dalam [0, 1]; `dikira` = degupan sah §4.4 (selebihnya dilukis pudar). */
  degupan: { x: number; dikira: boolean }[];
  ketukan: number[];
  /** Satu segmen setiap saat; `rendah` = bahagian berlorek, tidak dikira. Saat tanpa sampel = rendah. */
  kualiti: { x: number; w: number; rendah: boolean }[];
}

export function garisMasa(i: InputGaris): GarisMasa {
  const panjang = i.akhir - i.mula;
  if (!(panjang > 0)) return { degupan: [], ketukan: [], kualiti: [] };
  const x = (t: number) => (t - i.mula) / panjang;
  const dalam = (t: number) => t >= i.mula && t < i.akhir;
  const kualitiPada = (t: number) => i.kualitiSaat.get(Math.floor(t / US)) ?? null;
  const kualiti: GarisMasa["kualiti"] = [];
  for (let s = Math.floor(i.mula / US); s * US < i.akhir; s++) {
    const a = Math.max(i.mula, s * US);
    const b = Math.min(i.akhir, (s + 1) * US);
    const q = i.kualitiSaat.get(s);
    kualiti.push({ x: x(a), w: (b - a) / panjang, rendah: q === undefined || q < i.kualitiSaatMin });
  }
  return {
    degupan: i.degupan.filter((d) => dalam(d.t)).map((d) => ({ x: x(d.t), dikira: degupanSah(d, kualitiPada, i.kualitiSaatMin) })),
    ketukan: i.ketukan.filter(dalam).map(x),
    kualiti,
  };
}

export interface Ayat {
  kunci: string;
  nilai?: Record<string, string | number>;
}

/** Ayat pendedahan mengikut hasil: kiraan N/n, ayat statistik, sesaran (prinsip PAT), atau "tak cukup data". */
export function ayatDedah(h: HasilSkor, kfg: Pick<KonfigLiputan, "ketukan_min" | "rentang_min_s">): Ayat[] {
  const ayat: Ayat[] = [{ kunci: "rasa.kiraan", nilai: { N: h.N, n: h.n } }];
  if (!h.cukup) {
    ayat.push({ kunci: "rasa.tak_cukup" });
    if (h.sebab.includes("ketukan")) ayat.push({ kunci: "dedah.sebab_ketukan", nilai: { n: h.nKetukanSah, min: h.nMin } });
    if (h.sebab.includes("kualiti")) ayat.push({ kunci: "dedah.sebab_kualiti" });
    return ayat;
  }
  if (!h.liputanCukup) {
    // K1/D29: terlalu sedikit atau terlalu sempit untuk menilai; nombor ayat dari hasil dan config, bukan R.
    const nilai = { n: h.nKetukanSah, s: Math.round(h.rentangS), min: kfg.ketukan_min, smin: kfg.rentang_min_s };
    // L2: satu kiraan sahaja. Bila sebahagian ketukan tidak jatuh antara dua degupan jelas, ayat menyebut kedua-dua nombor
    // supaya ia tidak bercanggah dengan "Kau ketuk {n}." di atasnya.
    if (h.nKetukanSah !== h.n) ayat.push({ kunci: "dedah.terlalu_sedikit_sebahagian", nilai: { ...nilai, jumlah: h.n } });
    else ayat.push({ kunci: `dedah.makna.${h.jalur}`, nilai });
    return ayat;
  }
  const sama = ayatSama(h);
  if (sama) ayat.push(sama);
  // K1: satu ayat makna setiap jalur (ayat tetap lama tidak dapat dipertahankan untuk ketukan berentak; D29).
  ayat.push({ kunci: `dedah.makna.${h.jalur}` });
  // Sesaran hanya bermakna bila ketukan berkumpul pada satu fasa; bila meneka, purata fasa ialah hingar.
  if (h.sesaranMs !== null && h.jalur !== "meneka") ayat.push({ kunci: "dedah.sesaran", nilai: { ms: h.sesaranMs } });
  return ayat;
}

/**
 * "x kali daripada 10; kebetulan memberi kira-kira a atau b" (PH§5.2 J2.1). Dipapar HANYA bila ia menyokong jalur: jalur meneka
 * dengan x di atas paras kebetulan, atau jalur lain dengan x pada paras kebetulan, ialah dua ayat yang bercanggah → tiada ayat.
 */
export function ayatSama(h: HasilSkor): Ayat | null {
  if (h.samaDaripada10 === null || h.jalur === null || h.liputanCukup === false) return null;
  const a = Math.floor(h.peluangDaripada10);
  const b = Math.max(Math.ceil(h.peluangDaripada10), a + 1);
  const atasKebetulan = h.samaDaripada10 > b;
  if (atasKebetulan !== (h.jalur !== "meneka")) return null;
  return { kunci: "dedah.sama", nilai: { x: h.samaDaripada10, a, b } };
}
