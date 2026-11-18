import { describe, expect, it } from "vitest";
import app from "../config/app.json";
import { PengesanDegupan, type KonfigBeats } from "../src/core/beats";
import type { MetrikSdk } from "../src/core/metrik";
import { PenjanaSim, type KonfigSim } from "../src/sumber/sim";

const US = 1e6;
const T0 = 1_762_000_000_000_000; // µs epoch tetap
const KFG = app.beats as KonfigBeats;
// Toleransi padanan degupan benar ↔ dikesan dalam ujian (bukan nilai app).
const PADANAN_US = 150_000;

function larian(sim: Partial<KonfigSim>, tempoh_s: number, ubah?: (m: MetrikSdk) => MetrikSdk) {
  const penjana = new PenjanaSim({ ...(app.sim as KonfigSim), ...sim }, T0);
  const pengesan = new PengesanDegupan(KFG);
  for (const m of penjana.jana(tempoh_s)) pengesan.tambahMetrik(ubah ? ubah(m) : m);
  return { benar: penjana.degupanBenar(tempoh_s), dikesan: pengesan.degupan(), pengesan };
}

function nilai(benar: number[], dikesan: readonly { t: number }[], dari_s: number, hingga_s: number) {
  const dinilai = benar.filter((t) => t >= T0 + dari_s * US && t <= T0 + hingga_s * US);
  const ralat: number[] = [];
  for (const t of dinilai) {
    let terbaik = Infinity;
    for (const d of dikesan) terbaik = Math.min(terbaik, Math.abs(d.t - t));
    if (terbaik <= PADANAN_US) ralat.push(terbaik / 1000);
  }
  ralat.sort((a, b) => a - b);
  return { kadar: ralat.length / dinilai.length, medianMs: ralat[Math.floor(ralat.length / 2)] ?? Infinity };
}

describe("PengesanDegupan atas isyarat sim (PRD §4.3)", () => {
  const kes: [number, number][] = [
    [55, 1],
    [65, 2],
    [75, 3],
    [85, 4],
    [95, 5],
    [70, 6],
    [90, 7],
  ];

  it.each(kes)("nadi %i BPM, benih %i: ≥ 95%% dikesan, median < 40 ms, tiada puncak dalam refraktori", (bpm, benih) => {
    const { benar, dikesan } = larian({ nadi_bpm: bpm, benih }, 60);
    const { kadar, medianMs } = nilai(benar, dikesan, 5, 59);
    expect(kadar).toBeGreaterThanOrEqual(0.95);
    expect(medianMs).toBeLessThan(40);
    for (let i = 1; i < dikesan.length; i++) {
      expect((dikesan[i]!.t - dikesan[i - 1]!.t) / 1000).toBeGreaterThanOrEqual(KFG.refraktori_ms);
    }
    // Isyarat bersih tidak sepatutnya mencetus semakan kendiri atau banyak "ragu".
    expect(dikesan.filter((d) => d.ragu).length / dikesan.length).toBeLessThan(0.05);
  });

  it("kualiti = pecahan sampel dengan keyakinan ≥ ambang stabil", () => {
    const tinggi = larian({ keyakinan: 70 }, 12).pengesan;
    const rendah = larian({ keyakinan: 20 }, 12).pengesan;
    expect(tinggi.kualitiAntara(T0, T0 + 12 * US)).toBe(1);
    expect(rendah.kualitiAntara(T0, T0 + 12 * US)).toBe(0);
    expect(tinggi.kualitiAntara(T0 + 100 * US, T0 + 110 * US)).toBeNull();
  });

  it("semakan kendiri: pulse_rate SDK berbeza > 10% → amaran bising, degupan dikecualikan", () => {
    const { pengesan } = larian({ nadi_bpm: 72 }, 40, (m) => {
      for (const p of m.cardio?.pulseRate ?? []) p.value = 100; // SDK kata 100, isyarat 72
      return m;
    });
    expect(pengesan.amaranBising().length).toBeGreaterThan(0);
    expect(pengesan.degupan().some((d) => d.bising)).toBe(true);
  });

  it("semakan kendiri lulus bila pulse_rate sepadan", () => {
    const { pengesan } = larian({ nadi_bpm: 72 }, 40);
    expect(pengesan.amaranBising()).toEqual([]);
  });

  it("hanya cardio.arterialPressureTrace dibaca: tanpanya tiada degupan (tiada sandaran medan lain)", () => {
    const { dikesan } = larian({ nadi_bpm: 70, benih: 9 }, 40, (m) => {
      const jejak = m.cardio?.arterialPressureTrace ?? [];
      const t = Number(jejak[0]?.timestamp ?? 0);
      if (t < T0 + 10 * US) return m;
      // Bentuk lama (sebelum J1) yang Metrics 3.4.0 tidak pernah hantar: mesti diabaikan.
      return { cardio: { pulseRate: m.cardio?.pulseRate ?? [] }, pulse: { trace: jejak } } as MetrikSdk;
    });
    expect(dikesan.filter((d) => d.t > T0 + 11 * US)).toEqual([]);
  });

  it("jurang > 2 s ditanda pada degupan pertama selepasnya", () => {
    const { dikesan } = larian({ nadi_bpm: 70 }, 30, (m) => {
      const jejak = m.cardio?.arterialPressureTrace ?? [];
      const t = Number(jejak[0]?.timestamp ?? 0);
      if (t >= T0 + 12 * US && t < T0 + 15 * US) return { cardio: { pulseRate: m.cardio?.pulseRate ?? [] } };
      return m;
    });
    const selepas = dikesan.find((d) => d.t > T0 + 15 * US);
    expect(selepas?.jurang).toBe(true);
    expect(dikesan.filter((d) => d.jurang).length).toBe(1);
  });

  it("puncak dengan sela tidak munasabah ditanda ragu", () => {
    const p = new PengesanDegupan(KFG);
    p.tambahMetrik({ cardio: { pulseRate: [{ value: 60, confidence: 80, timestamp: T0 }] } });
    // Dua puncak tajam 400 ms terpisah selepas pemanasan: sela 0.4 s < 0.6 × 1 s.
    const fs = KFG.kadar_hz;
    for (let i = 0; i < fs * 10; i++) {
      const s = i / fs;
      const puncak = Math.abs(s - 6) < 0.05 || Math.abs(s - 6.4) < 0.05 || Math.abs(s - 5) < 0.05 ? 5 : 0;
      p.tambahSampel({ t: T0 + s * US, v: puncak, c: 80 });
    }
    const d = p.degupan();
    expect(d.length).toBeGreaterThanOrEqual(3);
    expect(d.find((x) => Math.abs(x.t - (T0 + 6.4 * US)) < 0.2 * US)?.ragu).toBe(true);
  });

  it("cap masa Long (toNumber) diterima", () => {
    const p = new PengesanDegupan(KFG);
    const penjana = new PenjanaSim(app.sim as KonfigSim, T0);
    for (const m of penjana.jana(15)) {
      for (const s of m.cardio?.arterialPressureTrace ?? []) {
        const n = Number(s.timestamp);
        s.timestamp = { toNumber: () => n };
      }
      p.tambahMetrik(m);
    }
    expect(p.degupan().length).toBeGreaterThan(10);
  });
});

describe("PenjanaSim", () => {
  it("boleh diulang ikut benih dan memancarkan bentuk payload SDK", () => {
    const a = new PenjanaSim(app.sim as KonfigSim, T0).jana(3);
    const b = new PenjanaSim(app.sim as KonfigSim, T0).jana(3);
    expect(a).toEqual(b);
    const sampel = a[0]!.cardio!.arterialPressureTrace![0]!;
    expect(Object.keys(sampel).sort()).toEqual(["confidence", "stable", "timestamp", "value"]);
    expect(a.some((m) => (m.cardio?.pulseRate ?? []).length > 0)).toBe(true);
    expect(a.some((m) => (m.breathing?.upperTrace ?? []).length > 0)).toBe(true);
  });

  it("degupan benar mengikut nadi purata", () => {
    const p = new PenjanaSim({ ...(app.sim as KonfigSim), hanyut_bpm: 0, rsa_bpm: 0, nadi_bpm: 60 }, T0);
    const d = p.degupanBenar(10);
    expect(d.length).toBe(11);
    expect((d[1]! - d[0]!) / US).toBeCloseTo(1, 6);
  });
});
