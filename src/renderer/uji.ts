// Cangkuk ujian Playwright (D11): `window.degupUji` dipasang HANYA bila sumber = sim. Live/replay tidak pernah mendedahkannya.
// Ketukan bertulis mengikut degupan yang dikesan supaya ujian jalur deterministik (sefasa → Selaras; fasa tersebar → Meneka).
import type { Ruang } from "./app.js";
import { kiniUs } from "./sesi.js";

/** Pecahan emas: fasa i·φ mod 1 tersebar sekata dalam kitaran (resultan hampir sifar, tiada penguncian fasa). */
const PHI = 0.6180339887;

export interface CangkukUji {
  petunjuk(kod: number): void;
  /** Satu ketukan setiap degupan dikesan dalam tetingkap RASA, `sesaranMs` selepasnya; `had` = hanya N degupan pertama. */
  ketukSefasa(sesaranMs: number, had?: number): number;
  /** Satu ketukan setiap kitaran degupan pada fasa i·φ mod 1. Pulang bilangan ketukan. */
  ketukTersebar(): number;
  /** Satu ketukan tepat pada mula tetingkap RASA (sebelum degupan pertama → tidak dikira; L2 "n daripada jumlah"). */
  ketukAwal(): number;
}

export function pasangCangkukUji(r: Ruang): void {
  if (r.k.sumber !== "sim") return;
  const degupanTetingkap = () => {
    const w = r.sesi?.rasa;
    if (!w || !r.sesi) return { w: null, d: [] as number[] };
    const kini = kiniUs();
    return { w, d: r.sesi.pengesan.degupan().filter((x) => x.t >= w.mula && x.t < kini).map((x) => x.t) };
  };
  const cangkuk: CangkukUji = {
    petunjuk: (kod) => r.sesi?.suntikPetunjuk(kod),
    ketukSefasa(sesaranMs, had) {
      const { w, d: semua } = degupanTetingkap();
      const d = semua.slice(0, had ?? semua.length);
      for (const t of d) w?.ketuk(t + sesaranMs * 1000);
      return w ? d.length : 0;
    },
    ketukTersebar() {
      const { w, d } = degupanTetingkap();
      let n = 0;
      for (let i = 0; i + 1 < d.length; i++) {
        w?.ketuk(d[i]! + ((i * PHI) % 1) * (d[i + 1]! - d[i]!));
        n++;
      }
      return w ? n : 0;
    },
    ketukAwal() {
      const w = r.sesi?.rasa;
      w?.ketuk(w.mula);
      return w ? 1 : 0;
    },
  };
  (window as unknown as { degupUji: CangkukUji }).degupUji = cangkuk;
}
