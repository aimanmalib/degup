import { describe, expect, it } from "vitest";
import app from "../config/app.json";
import type { Degupan } from "../src/core/beats";
import { fasaKetukan, kiraSkor, pilihJalur, rayleigh, resultan, type KonfigSkor } from "../src/core/score";
import { mulberry32 } from "../src/sumber/sim";
import { larianSim, T0, US } from "./bantu-sim";

const KFG = app.rasa as KonfigSkor;
const MULA = T0 + 20 * US; // tetingkap RASA 40 s selepas LIHAT
const AKHIR = MULA + 40 * US;

function skorDengan(ketukan: (benar: number[], rawak: () => number) => number[], sim = {}, benih = 3) {
  const { pengesan, benar } = larianSim(sim, 62);
  const rawak = mulberry32(benih);
  const k = ketukan(benar.filter((t) => t >= MULA && t < AKHIR), rawak);
  return kiraSkor(
    {
      degupan: pengesan.degupan(),
      ketukan: k,
      mula: MULA,
      akhir: AKHIR,
      kualitiTetingkap: pengesan.kualitiAntara(MULA, AKHIR),
      kualitiPada: (t) => pengesan.kualitiPada(t),
    },
    KFG,
  );
}

const sefasa = (b: number[], r: () => number) => b.map((t) => t + (220 + (r() * 2 - 1) * 50) * 1000);
const rawakSeragam = (b: number[], r: () => number) => b.map(() => MULA + r() * 40 * US).sort((a, x) => a - x);

describe("kiraSkor atas sim (PRD §4.4)", () => {
  it("ketukan sefasa → Selaras, sesaran ms munasabah", () => {
    const h = skorDengan(sefasa);
    expect(h.cukup).toBe(true);
    expect(h.nKetukanSah).toBeGreaterThanOrEqual(KFG.n_min);
    expect(h.R).toBeGreaterThan(0.8);
    expect(h.jalur).toBe("selaras");
    expect(h.skor).toBe(Math.round(h.R * 100));
    expect(h.sesaranMs).toBeGreaterThan(160);
    expect(h.sesaranMs).toBeLessThan(280);
    expect(h.samaDaripada10).toBeGreaterThanOrEqual(9);
  });

  it("ketukan rawak → Meneka atas beberapa benih", () => {
    for (const benih of [11, 12, 13, 14]) {
      const h = skorDengan(rawakSeragam, {}, benih);
      expect(h.cukup, `benih ${benih}`).toBe(true);
      expect(h.jalur, `benih ${benih} R=${h.R.toFixed(2)} p=${h.p.toFixed(3)}`).toBe("meneka");
    }
  });

  it("separuh sefasa, separuh rawak → Ada rasa", () => {
    const h = skorDengan((b, r) => {
      const s = sefasa(b, r);
      return s.map((t, i) => (i % 2 ? MULA + r() * 40 * US : t)).sort((a, x) => a - x);
    });
    expect(h.cukup).toBe(true);
    expect(h.R).toBeLessThan(0.6);
    expect(h.p).toBeLessThan(0.05);
    expect(h.jalur).toBe("ada_rasa");
  });

  it("ketukan sefasa hanya 12 s pertama → cukup data tetapi liputan gagal: jalur terlalu_sedikit, bukan Selaras (K1)", () => {
    const h = skorDengan((b, r) => sefasa(b, r).filter((t) => t < MULA + 12 * US));
    expect(h.cukup).toBe(true);
    expect(h.R).toBeGreaterThan(0.8);
    expect(h.liputanCukup).toBe(false);
    expect(h.rentangS).toBeLessThan(KFG.liputan.rentang_min_s);
    expect(h.jalur).toBe(KFG.liputan.jalur);
  });

  it("terlalu sedikit ketukan → tak cukup data, tiada jalur", () => {
    const h = skorDengan((b, r) => sefasa(b, r).slice(0, KFG.n_min - 1));
    expect(h.cukup).toBe(false);
    expect(h.sebab).toEqual(["ketukan"]);
    expect(h.jalur).toBeNull();
  });

  it("keyakinan rendah → tak cukup data (kualiti)", () => {
    const h = skorDengan(sefasa, { keyakinan: 20 });
    expect(h.cukup).toBe(false);
    expect(h.sebab).toContain("kualiti");
    expect(h.jalur).toBeNull();
  });
});

describe("blok asas skor", () => {
  const d = (t: number, o: Partial<Degupan> = {}): Degupan => ({ t, ragu: false, jurang: false, bising: false, ...o });

  it("fasa = 2π(t − b_i)/(b_{i+1} − b_i); hanya antara dua degupan sah", () => {
    const deg = [d(0), d(1e6), d(2e6), d(3e6)];
    const { fasa, ibiUs } = fasaKetukan([true, true, false, true], deg, [-1, 0.25e6, 1.5e6, 2.5e6, 3.5e6]);
    expect(fasa).toHaveLength(1);
    expect(fasa[0]).toBeCloseTo(Math.PI / 2, 9);
    expect(ibiUs).toEqual([1e6]);
  });

  it("degupan ragu/jurang/bising tidak sah", () => {
    const deg = [d(T0), d(T0 + US, { ragu: true }), d(T0 + 2 * US), d(T0 + 3 * US, { jurang: true }), d(T0 + 4 * US, { bising: true })];
    const ketukan = [0.5, 1.5, 2.5, 3.5].map((s) => T0 + s * US);
    const h = kiraSkor(
      { degupan: deg, ketukan, mula: T0, akhir: T0 + 5 * US, kualitiTetingkap: 1, kualitiPada: () => 1 },
      KFG,
    );
    expect(h.nDegupanSah).toBe(2);
    expect(h.nKetukanSah).toBe(0);
    expect(h.N).toBe(5);
    expect(h.n).toBe(4);
  });

  it("degupan dalam saat berkualiti rendah tidak sah", () => {
    const deg = [d(T0), d(T0 + US), d(T0 + 2 * US)];
    const h = kiraSkor(
      {
        degupan: deg,
        ketukan: [T0 + 0.5 * US, T0 + 1.5 * US],
        mula: T0,
        akhir: T0 + 3 * US,
        kualitiTetingkap: 1,
        kualitiPada: (t) => (t >= T0 + 2 * US ? 0 : 1),
      },
      KFG,
    );
    expect(h.nKetukanSah).toBe(1);
  });

  it("resultan dan Rayleigh", () => {
    expect(resultan([1, 1, 1]).R).toBeCloseTo(1, 12);
    expect(resultan([0, Math.PI]).R).toBeCloseTo(0, 12);
    expect(resultan([-0.1]).sudut).toBeCloseTo(2 * Math.PI - 0.1, 12);
    expect(rayleigh(10, 0.5)).toEqual({ z: 2.5, p: Math.exp(-2.5) });
    expect(rayleigh(0, 0).p).toBe(1);
  });

  it("jalur ikut config, padanan pertama (D4)", () => {
    expect(pilihJalur(KFG.jalur, 0.7, 0.001)).toBe("selaras");
    expect(pilihJalur(KFG.jalur, 0.7, 0.02)).toBe("ada_rasa");
    // K1/D29: p < 0.05 sahaja tidak cukup lagi; R mesti ≥ r_min ada_rasa (0.45).
    expect(pilihJalur(KFG.jalur, 0.5, 0.04)).toBe("ada_rasa");
    expect(pilihJalur(KFG.jalur, 0.4, 0.04)).toBe("meneka");
    expect(pilihJalur(KFG.jalur, 0.9, 0.05)).toBe("meneka");
    expect(() => pilihJalur([{ id: "x", p_bawah: 0.5 }], 0, 1)).toThrow();
  });
});
