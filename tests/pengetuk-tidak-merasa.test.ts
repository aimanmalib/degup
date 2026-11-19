// Honest score (K1): tappers who feel nothing must rarely reach "Some sense" or above; tappers who feel must. Limits are fixed by
// the plan (PH§5.5 K1); if the repo misses them, tune thresholds in config/app.json, never these limits.
import { describe, expect, it } from "vitest";
import app from "../config/app.json";
import type { KonfigSkor } from "../src/core/score";
import { mulberry32 } from "../src/sumber/sim";
import { kiraJalur, MODEL_LALAI, pusingan } from "./pengetuk-model";

const KFG = app.rasa as KonfigSkor;
const N = 2000;
const BENIH = 2026;
const peratus = (id: string) => kiraJalur(id, KFG, N, BENIH);
const keAtas = (p: Record<string, number>) => (p.ada_rasa ?? 0) + (p.selaras ?? 0);

describe("pengetuk yang tidak merasa (K1, 2,000 pusingan berbenih setiap model)", () => {
  const hasil = Object.fromEntries(
    ["fasa_bebas", "jarak_rawak", "rentak_dekat", "rentak_nadi", "merasa_lemah", "merasa_jelas"].map((id) => [id, peratus(id)]),
  );

  it.each(["fasa_bebas", "jarak_rawak", "rentak_dekat"])("%s: Some sense ke atas ≤ 10%%", (id) => {
    expect(keAtas(hasil[id]!), JSON.stringify(hasil[id])).toBeLessThanOrEqual(10);
  });

  it("rentak pada kadar nadi: Some sense ke atas ≤ 20%", () => {
    expect(keAtas(hasil.rentak_nadi!), JSON.stringify(hasil.rentak_nadi)).toBeLessThanOrEqual(20);
  });

  it.each(["fasa_bebas", "jarak_rawak", "rentak_dekat", "rentak_nadi"])("%s: In tune ≤ 5%%", (id) => {
    expect(hasil[id]!.selaras ?? 0, JSON.stringify(hasil[id])).toBeLessThanOrEqual(5);
  });

  it("merasa lemah ≥ 80%, merasa jelas ≥ 99% (Some sense ke atas)", () => {
    expect(keAtas(hasil.merasa_lemah!), JSON.stringify(hasil.merasa_lemah)).toBeGreaterThanOrEqual(80);
    expect(keAtas(hasil.merasa_jelas!), JSON.stringify(hasil.merasa_jelas)).toBeGreaterThanOrEqual(99);
  });

  it("12 ketukan berentak dalam 10 saat = Too few taps to tell, bukan Guessing atau In tune", () => {
    const r = mulberry32(7);
    // Rentak tetap 800 ms dari saat 5: 12 ketukan merentasi 8.8 s (corak juri: Space setiap 0.8 s, kemudian berhenti).
    const h = pusingan(() => Array.from({ length: 12 }, (_, i) => 5 + 0.8 * i), KFG, r, MODEL_LALAI);
    expect(h.nKetukanSah).toBe(12);
    expect(h.rentangS).toBeCloseTo(8.8, 3);
    expect(h.cukup).toBe(true);
    expect(h.liputanCukup).toBe(false);
    expect(h.jalur).toBe(KFG.liputan.jalur);
    expect(KFG.liputan.jalur).toBe("terlalu_sedikit");
  });
});
