// Bentuk payload dikunci terhadap pakej SDK TERPASANG (J1): objek dibina dengan `Metrics.fromObject`, dikod, kemudian
// `decodeMetrics` (laluan sama seperti sumber live). Medan yang `Metrics` 3.4.0 tiada (cth `pulse`) hilang dalam pusingan ini,
// jadi sim/replay yang menjana bentuk rekaan gagal di sini dan bukan diam-diam lulus.
import { Metrics, decodeMetrics } from "@smartspectra/node-sdk/messages";
import { describe, expect, it } from "vitest";
import app from "../config/app.json";
import { PengesanDegupan, type KonfigBeats } from "../src/core/beats";
import { fixtureKeMetrik, PengumpulFixture, type Fixture } from "../src/core/fixture";
import { PengumpulLentur } from "../src/core/lentur";
import type { MetrikSdk } from "../src/core/metrik";
import { PenjejakStabil } from "../src/core/stabil";
import { janaFixtureSim, type JanaSimContoh } from "../src/sumber/sim-fixture";
import { PenjanaSim, type KonfigSim } from "../src/sumber/sim";

const US = 1e6;
const T0 = 1_762_000_000_000_000;
const STABIL = app.beats.keyakinan_stabil;
const SIM = app.sim as KonfigSim;

/** Pusingan SDK: objek → protobuf → `decodeMetrics` (Long untuk cap masa, seperti mod live). */
const pusing = (m: unknown): MetrikSdk =>
  decodeMetrics(Metrics.encode(Metrics.fromObject(m as Record<string, unknown>)).finish()) as unknown as MetrikSdk;

/** Objek biasa (cap masa nombor) selepas pusingan SDK, untuk banding kunci dan nilai. */
const biasa = (m: unknown): unknown =>
  Metrics.toObject(Metrics.fromObject(m as Record<string, unknown>), { longs: Number });

describe("bentuk Metrics 3.4.0 (pakej terpasang)", () => {
  it("Metrics hanya ada breathing, micromotion, eda, face, cardio; pulse tidak bertahan", () => {
    const penuh = Metrics.toObject(Metrics.create(), { defaults: true, arrays: true, objects: true });
    expect(Object.keys(penuh).sort()).toEqual(["breathing", "cardio", "eda", "face", "micromotion"]);
    expect(biasa({ pulse: { trace: [{ value: 1 }] } })).toEqual({});
  });

  it("payload sim lulus pusingan SDK tanpa kehilangan kunci atau nilai", () => {
    const penjana = new PenjanaSim(SIM, T0);
    const semua = penjana.jana(20);
    expect(semua.some((m) => m.breathing?.rate?.length)).toBe(true);
    for (const m of semua) expect(biasa(m)).toEqual(m);
  });

  it("payload replay (fixture sim) lulus pusingan SDK tanpa kehilangan kunci atau nilai", () => {
    const j = { t0: T0, benih: 3, lihat_s: 5, rasa_s: 5, lentur_s: 5, ketuk_sesaran_ms: 250, ketuk_jitter_ms: 60, ketuk_kadar: 0.85 };
    const f: Fixture = janaFixtureSim(SIM, j as JanaSimContoh, app.replay.skema, "bentuk");
    for (const { m } of fixtureKeMetrik(f, app.replay.kelompok_ms, STABIL)) expect(biasa(m)).toEqual(m);
  });

  it("aliran dari decodeMetrics → degupan, nadi, nisbah degupan/nafas dan fixture muncul", () => {
    const pengesan = new PengesanDegupan(app.beats as KonfigBeats);
    const nadi = new PenjejakStabil(STABIL);
    const lentur = new PengumpulLentur(STABIL, 100);
    const fixture = new PengumpulFixture();
    for (const m of new PenjanaSim({ ...SIM, hanyut_bpm: 0 }, T0).jana(30).map(pusing)) {
      pengesan.tambahMetrik(m);
      nadi.tambahMetrik(m);
      lentur.tambahMetrik(m);
      fixture.tambahMetrik(m);
    }
    expect(pengesan.degupan().length).toBeGreaterThan(20);
    expect(nadi.keadaan.bpm).toBeCloseTo(SIM.nadi_bpm, 0);
    expect(lentur.nadiPurata(T0, T0 + 30 * US)).toBe(SIM.nadi_bpm);
    const nisbah = lentur.prq(T0, T0 + 30 * US);
    expect(nisbah.length).toBeGreaterThan(0);
    expect(nisbah[nisbah.length - 1]!.v).toBeCloseTo(SIM.nadi_bpm / SIM.nafas_per_min, 5);
    const f = fixture.keFixture({ skema: app.replay.skema, jenis: "ujian", label: "bentuk", tarikh: "2026-11-19" });
    expect(f.nadi.length).toBeGreaterThan(0);
    expect(f.kadar_nafas.length).toBeGreaterThan(0);
  });
});
