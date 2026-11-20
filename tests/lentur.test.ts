// P3c: pengumpul LENTUR, segmen fasa (panduan / jejak), keputusan + baris kad. PRD §4.2, §4.5.
import { describe, expect, it } from "vitest";
import app from "../config/app.json";
import en from "../lang/en.json";
import ms from "../lang/ms.json";
import { binaKeputusan, barisKad, PengumpulLentur, segmenFasa, segmenPanduan, tarikhTempatan } from "../src/core/lentur";
import type { MetrikSdk } from "../src/core/metrik";
import type { KonfigLentur } from "../src/core/rsa";
import type { HasilSkor } from "../src/core/score";
import { PenjanaSim, type KonfigSim } from "../src/sumber/sim";
import { T0, US } from "./bantu-sim";

const KFG = app.lentur as KonfigLentur;
const STABIL = app.beats.keyakinan_stabil;
const KITARAN_S = KFG.tarik_s + KFG.hembus_s;

function kumpulSim(tempoh_s: number, sim: Partial<KonfigSim> = {}, simpanS = 1000): PengumpulLentur {
  const p = new PengumpulLentur(STABIL, simpanS);
  for (const m of new PenjanaSim({ ...(app.sim as KonfigSim), ...sim }, T0).jana(tempoh_s)) p.tambahMetrik(m);
  return p;
}

describe("PengumpulLentur", () => {
  it("mengumpul nafas, nisbah dan nadi dari payload sim; purata nadi dalam julat penjana", () => {
    const p = kumpulSim(40);
    expect(p.nafas().length).toBeGreaterThan(40 * app.sim.kadar_hz * 0.9);
    expect(p.prq(T0, T0 + 40 * US).length).toBeGreaterThan(30);
    const bpm = p.nadiPurata(T0, T0 + 40 * US)!;
    expect(Math.abs(bpm - app.sim.nadi_bpm)).toBeLessThanOrEqual(app.sim.hanyut_bpm + 1);
  });

  it("nadi tidak stabil tidak dikira dalam purata; tiada ukuran stabil = null", () => {
    const p = kumpulSim(20, { keyakinan: STABIL - 10 });
    expect(p.nadiPurata(T0, T0 + 20 * US)).toBeNull();
  });

  it("sampel lebih lama daripada had simpanan dibuang", () => {
    const p = kumpulSim(60, {}, 20);
    const nafas = p.nafas();
    expect(nafas[nafas.length - 1]!.t - nafas[0]!.t).toBeLessThanOrEqual(20 * US);
    expect(p.nadiPurata(T0, T0 + 30 * US)).toBeNull();
  });

  it("degupan setiap nafas = nadi stabil terkini ÷ kadar nafas stabil terkini; nilai tidak stabil/bukan nombor diabaikan", () => {
    const p = new PengumpulLentur(STABIL, 100);
    const m: MetrikSdk = {
      cardio: { pulseRate: [{ value: 72, confidence: 80, stable: true, timestamp: T0 }] },
      breathing: {
        rate: [
          { value: 6, confidence: 80, stable: true, timestamp: T0 + 2 },
          { value: 20, confidence: 10, stable: false, timestamp: T0 + 3 },
        ],
        upperTrace: [{ value: Number.NaN, timestamp: T0 }, { value: 0.2, timestamp: T0 + 1 }],
      },
    };
    p.tambahMetrik(m);
    expect(p.prq(T0, T0 + 10)).toEqual([{ t: T0 + 2, v: 12, stabil: true }]);
    p.tambahMetrik({ cardio: { pulseRate: [{ value: 66, confidence: 80, stable: true, timestamp: T0 + 5 }] } });
    expect(p.prq(T0 + 4, T0 + 10)).toEqual([{ t: T0 + 5, v: 11, stabil: true }]);
    expect(p.nafas()).toEqual([{ t: T0 + 1, v: 0.2, stabil: true }]);
  });
});

describe("segmen fasa (lorek jalur IBI)", () => {
  it("panduan: tarik tarik_s kemudian hembus hembus_s, berselang, dipotong pada hingga", () => {
    const s = segmenPanduan(T0, T0 + (KITARAN_S + KFG.tarik_s / 2) * US, KFG);
    expect(s.map((x) => x.fasa)).toEqual(["tarik", "hembus", "tarik"]);
    expect(s[0]!.akhir - s[0]!.mula).toBe(KFG.tarik_s * US);
    expect(s[1]!.akhir - s[1]!.mula).toBe(KFG.hembus_s * US);
    expect(s[2]!.akhir).toBe(T0 + (KITARAN_S + KFG.tarik_s / 2) * US);
  });

  it("jejak nafas stabil diutamakan: segmen berselang mengikut cerun jejak sim", () => {
    const p = kumpulSim(60);
    const { sumber, segmen } = segmenFasa(p.nafas(), T0, T0 + 60 * US, true, KFG);
    expect(sumber).toBe("jejak");
    for (let i = 1; i < segmen.length; i++) expect(segmen[i]!.fasa).not.toBe(segmen[i - 1]!.fasa);
    // Sim: nafas = sinus nafas_per_min → ~2 segmen setiap kitaran.
    const kitaran = (60 * app.sim.nafas_per_min) / 60;
    expect(segmen.length).toBeGreaterThanOrEqual(2 * kitaran - 1);
    expect(segmen.length).toBeLessThanOrEqual(2 * kitaran + 2);
  });

  it("jejak tidak dibenarkan atau tidak stabil → panduan", () => {
    const p = kumpulSim(30);
    expect(segmenFasa(p.nafas(), T0, T0 + 30 * US, false, KFG).sumber).toBe("panduan");
    const tidakStabil = p.nafas().map((x) => ({ ...x, stabil: false }));
    expect(segmenFasa(tidakStabil, T0, T0 + 30 * US, true, KFG).sumber).toBe("panduan");
  });
});

describe("keputusan + baris kad", () => {
  const skor = { cukup: true, liputanCukup: true, skor: 74, jalur: "selaras", N: 47, n: 41 } as HasilSkor;

  it("skor tak cukup = tiada skor/jalur, kiraan dikekalkan", () => {
    const k = binaKeputusan({ ...skor, cukup: false, jalur: null }, null, null, "2026-11-09");
    expect(k).toMatchObject({ skor: null, jalur: null, N: 47, n: 41, lambatMs: null, prq: null, nadiPurata: null });
  });

  it("L2: terlalu sedikit ketukan = jalur kekal, nombor skor TIDAK (kad dan PNG memapar sengkang)", () => {
    const k = binaKeputusan({ ...skor, skor: 95, liputanCukup: false, jalur: "terlalu_sedikit" }, null, null, "2026-11-09");
    expect(k).toMatchObject({ skor: null, jalur: "terlalu_sedikit", N: 47, n: 41 });
    expect(binaKeputusan(skor, null, null, "2026-11-09").skor).toBe(74);
  });

  it("baris kad: susunan tetap, nilai null bila tiada; setiap kunci wujud dalam BM dan EN", () => {
    const k = binaKeputusan(skor, { ringkasanMs: 63, prq: 4.2 } as never, 71, "2026-11-09");
    const b = barisKad(k);
    expect(b.map((x) => x.id)).toEqual(["kiraan", "lambat", "prq", "nadi"]);
    expect(b[1]!.nilai).toEqual({ kunci: "keputusan.ms", nilai: { ms: 63 } });
    expect(barisKad({ ...k, prq: null })[2]!.nilai).toBeNull();
    const ada = (lang: unknown, kunci: string) =>
      typeof kunci.split(".").reduce<unknown>((o, x) => (o as Record<string, unknown> | undefined)?.[x], lang) === "string";
    for (const x of b)
      for (const kunci of [x.label, x.nilai?.kunci ?? "keputusan.tiada"]) {
        expect(ada(ms, kunci), kunci).toBe(true);
        expect(ada(en, kunci), kunci).toBe(true);
      }
  });

  it("tarikh tempatan YYYY-MM-DD", () => {
    expect(tarikhTempatan(new Date(2026, 10, 9, 23, 59))).toBe("2026-11-09");
  });
});
