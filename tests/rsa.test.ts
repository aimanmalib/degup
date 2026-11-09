import { describe, expect, it } from "vitest";
import app from "../config/app.json";
import type { Degupan } from "../src/core/beats";
import {
  fasaPanduan, julatKitaran, kiraIbi, kiraLentur, kitaranJejak, kitaranPanduan, ringkasPrq, type KonfigLentur,
} from "../src/core/rsa";
import { larianSim, T0, US } from "./bantu-sim";

const KFG = app.lentur as KonfigLentur;
const Q = app.rasa.kualiti_saat_min;

/** Rujukan dari degupan SEBENAR penjana: median (maks − min IBI) setiap kitaran panduan. */
function rujukan(benar: number[], mula: number, akhir: number): number {
  const deg: Degupan[] = benar.map((t) => ({ t, ragu: false, jurang: false, bising: false }));
  const ibi = kiraIbi(deg.filter((d) => d.t >= mula && d.t < akhir), () => 1, 0);
  const j = julatKitaran(ibi, kitaranPanduan(mula, akhir, KFG), KFG.min_degupan_kitaran)
    .flatMap((k) => (k.julatMs === null ? [] : [k.julatMs]))
    .sort((a, b) => a - b);
  return j[j.length >> 1]!;
}

describe("kiraLentur atas sim RSA diketahui (PRD §4.5)", () => {
  const kes = [
    { nadi_bpm: 72, rsa_bpm: 4, benih: 1 },
    { nadi_bpm: 60, rsa_bpm: 6, benih: 2 },
    { nadi_bpm: 85, rsa_bpm: 3, benih: 3 },
  ];
  for (const k of kes) {
    it(`nadi ${k.nadi_bpm}, RSA ±${k.rsa_bpm} BPM: ringkasan dalam ±10% rujukan`, () => {
      const { pengesan, benar, nafas, prq } = larianSim({ ...k, hanyut_bpm: 0 }, 75);
      const mula = T0 + 12 * US;
      const akhir = mula + 60 * US;
      const h = kiraLentur(
        { degupan: pengesan.degupan(), kualitiPada: (t) => pengesan.kualitiPada(t), kualitiSaatMin: Q, mula, akhir, nafas, prq },
        KFG,
      );
      const ruj = rujukan(benar, mula, akhir);
      // Analitik: 60000/(nadi − rsa) − 60000/(nadi + rsa); rujukan degupan sebenar mesti hampir dengannya.
      const analitik = 60000 / (k.nadi_bpm - k.rsa_bpm) - 60000 / (k.nadi_bpm + k.rsa_bpm);
      expect(Math.abs(ruj - analitik) / analitik).toBeLessThan(0.1);
      expect(h.ringkasanMs).not.toBeNull();
      expect(Math.abs(h.ringkasanMs! - ruj) / ruj, `dapat ${h.ringkasanMs}, rujukan ${ruj.toFixed(1)}`).toBeLessThan(0.1);
      expect(h.sumberKitaran).toBe("jejak");
      expect(h.prq).toBeCloseTo(k.nadi_bpm / app.sim.nafas_per_min, 1);
    });
  }

  it("jejak nafas tidak stabil → kitaran dari panduan", () => {
    const { pengesan, nafas } = larianSim({}, 40);
    const mula = T0 + 5 * US;
    const h = kiraLentur(
      {
        degupan: pengesan.degupan(), kualitiPada: (t) => pengesan.kualitiPada(t), kualitiSaatMin: Q,
        mula, akhir: mula + 30 * US, nafas: nafas.map((x) => ({ ...x, stabil: false })), prq: [],
      },
      KFG,
    );
    expect(h.sumberKitaran).toBe("panduan");
    expect(h.kitaran).toHaveLength(Math.floor(30 / (KFG.tarik_s + KFG.hembus_s)));
    expect(h.prq).toBeNull();
  });
});

describe("blok asas LENTUR", () => {
  const d = (s: number, o: Partial<Degupan> = {}): Degupan => ({ t: T0 + s * US, ragu: false, jurang: false, bising: false, ...o });

  it("IBI hanya dari pasangan degupan sah", () => {
    const ibi = kiraIbi([d(0), d(0.8), d(1.7, { ragu: true }), d(2.5), d(3.4)], () => 1, Q);
    expect(ibi.map((x) => Math.round(x.ms))).toEqual([800, 900]);
  });

  it("kitaran < min degupan → julat null; cukup → maks − min", () => {
    const ibi = kiraIbi([d(0), d(0.8), d(1.7), d(2.5), d(3.4), d(11), d(11.8)], () => 1, Q);
    const [a, b] = julatKitaran(ibi, kitaranPanduan(T0, T0 + 20 * US, KFG), KFG.min_degupan_kitaran);
    expect(a!.nDegupan).toBe(5);
    expect(a!.julatMs).toBeCloseTo(100, 6);
    expect(b!.julatMs).toBeNull();
  });

  it("fasa panduan: tarik dahulu, kemudian hembus, berulang", () => {
    const c = (KFG.tarik_s + KFG.hembus_s) * US;
    expect(fasaPanduan(T0 + 0.1 * US, T0, KFG)).toBe("tarik");
    expect(fasaPanduan(T0 + (KFG.tarik_s + 0.1) * US, T0, KFG)).toBe("hembus");
    expect(fasaPanduan(T0 + c + 0.1 * US, T0, KFG)).toBe("tarik");
  });

  it("kitaran jejak: tempoh nafas sinus dipulihkan", () => {
    const tempoh = 10;
    const nafas = Array.from({ length: 60 * 30 }, (_, i) => ({
      t: T0 + (i / 30) * US, v: Math.sin((2 * Math.PI * i) / 30 / tempoh), stabil: true,
    }));
    const k = kitaranJejak(nafas, T0, T0 + 60 * US, KFG)!;
    expect(k.length).toBeGreaterThanOrEqual(4);
    for (const x of k) expect((x.akhir - x.mula) / US).toBeCloseTo(tempoh, 0);
    expect(kitaranJejak([], T0, T0 + US, KFG)).toBeNull();
  });

  it("PRQ: nilai stabil terkini, satu perpuluhan", () => {
    expect(ringkasPrq([{ v: 4.04, stabil: true }, { v: 3.96, stabil: true }, { v: 9, stabil: false }])).toBe(4);
    expect(ringkasPrq([{ v: 4.26, stabil: false }])).toBeNull();
  });
});
