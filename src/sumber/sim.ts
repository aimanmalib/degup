// Sumber `sim` (PRD §4.10, ujian §4.3): isyarat sintetik berbentuk payload `decodeMetrics`, cap masa µs epoch.
// Gelombang = cos(2πφ) + h·cos(4πφ) + garis dasar + hingar putih; kedua-dua komponen jantung memuncak pada φ integer,
// jadi masa degupan sebenar = masa φ(t) melintasi integer. Nadi = asas + hanyut + RSA (nafas/min).
import type { MetrikSdk, UkuranKeyakinan, Ukuran } from "../core/metrik.js";
import type { Sumber } from "./jenis.js";

export interface KonfigSim {
  nadi_bpm: number;
  hanyut_bpm: number;
  hanyut_tempoh_s: number;
  rsa_bpm: number;
  nafas_per_min: number;
  harmonik: number;
  hingar: number;
  garis_dasar: number;
  garis_dasar_tempoh_s: number;
  kadar_hz: number;
  jitter_ms: number;
  keyakinan: number;
  kelompok_ms: number;
  kadar_nadi_setiap_s: number;
  benih: number;
}

const US = 1e6;

/** PRNG mulberry32: boleh diulang ikut benih. */
function mulberry32(benih: number): () => number {
  let a = benih >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export class PenjanaSim {
  private readonly rawak: () => number;
  private tSeterusnya: number;
  private tNadiSeterusnya: number;
  private readonly fNafas: number;

  /** @param t0 masa mula µs epoch (φ = 0 di sini). */
  constructor(
    private readonly kfg: KonfigSim,
    private readonly t0: number,
  ) {
    this.rawak = mulberry32(kfg.benih);
    this.tSeterusnya = t0;
    this.tNadiSeterusnya = t0;
    this.fNafas = kfg.nafas_per_min / 60;
  }

  /** Nadi serta-merta (BPM) pada masa s saat dari t0. */
  nadiPada(s: number): number {
    const k = this.kfg;
    return (
      k.nadi_bpm +
      k.hanyut_bpm * Math.sin((2 * Math.PI * s) / k.hanyut_tempoh_s) +
      k.rsa_bpm * Math.sin(2 * Math.PI * this.fNafas * s)
    );
  }

  /** Nadi tanpa RSA (purata tetingkap SDK) untuk `pulseRate`. */
  private nadiPurata(s: number): number {
    const k = this.kfg;
    return k.nadi_bpm + k.hanyut_bpm * Math.sin((2 * Math.PI * s) / k.hanyut_tempoh_s);
  }

  /** φ(s) = ∫ nadi/60 ds, analitik. */
  fasaPada(s: number): number {
    const k = this.kfg;
    const T = k.hanyut_tempoh_s;
    const fb = this.fNafas;
    const hanyut = ((k.hanyut_bpm * T) / (2 * Math.PI)) * (1 - Math.cos((2 * Math.PI * s) / T));
    const rsa = fb > 0 ? (k.rsa_bpm / (2 * Math.PI * fb)) * (1 - Math.cos(2 * Math.PI * fb * s)) : 0;
    return (k.nadi_bpm * s + hanyut + rsa) / 60;
  }

  /** Masa degupan sebenar (µs epoch) dalam [t0, t0 + tempoh_s]: φ melintasi integer. */
  degupanBenar(tempoh_s: number): number[] {
    const hasil: number[] = [];
    const akhir = Math.floor(this.fasaPada(tempoh_s));
    for (let n = 0; n <= akhir; n++) {
      let lo = 0;
      let hi = tempoh_s;
      for (let i = 0; i < 50; i++) {
        const mid = (lo + hi) / 2;
        if (this.fasaPada(mid) < n) lo = mid;
        else hi = mid;
      }
      hasil.push(this.t0 + hi * US);
    }
    return hasil;
  }

  private gauss(): number {
    const u = Math.max(this.rawak(), 1e-12);
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * this.rawak());
  }

  /** Kelompok seterusnya (`kelompok_ms`) sebagai payload metrik. */
  seterusnya(): MetrikSdk {
    const k = this.kfg;
    const akhir = this.tSeterusnya + k.kelompok_ms * 1000;
    const jejak: UkuranKeyakinan[] = [];
    const nafas: Ukuran[] = [];
    const stabil = k.keyakinan >= 40;
    let t = this.tSeterusnya;
    while (t < akhir) {
      const s = (t - this.t0) / US;
      const fasa = 2 * Math.PI * this.fasaPada(s);
      const v =
        Math.cos(fasa) +
        k.harmonik * Math.cos(2 * fasa) +
        k.garis_dasar * Math.sin((2 * Math.PI * s) / k.garis_dasar_tempoh_s) +
        k.hingar * this.gauss();
      const ts = Math.round(t);
      jejak.push({ value: v, confidence: k.keyakinan, stable: stabil, timestamp: ts });
      nafas.push({ value: Math.sin(2 * Math.PI * this.fNafas * s), stable: stabil, timestamp: ts });
      const jitter = (this.rawak() * 2 - 1) * k.jitter_ms * 1000;
      t += US / k.kadar_hz + jitter;
    }
    this.tSeterusnya = t;
    const m: MetrikSdk = {
      cardio: { arterialPressureTrace: jejak },
      breathing: { upperTrace: nafas },
    };
    if (this.tSeterusnya >= this.tNadiSeterusnya) {
      const s = (this.tNadiSeterusnya - this.t0) / US;
      const ts = Math.round(this.tNadiSeterusnya);
      (m.cardio ??= {}).pulseRate = [
        { value: this.nadiPurata(s), confidence: k.keyakinan, stable: stabil, timestamp: ts },
      ];
      (m.breathing ??= {}).rate = [
        { value: k.nafas_per_min, confidence: k.keyakinan, stable: stabil, timestamp: ts },
      ];
      this.tNadiSeterusnya += k.kadar_nadi_setiap_s * US;
    }
    return m;
  }

  /** Masa (µs epoch) sampel pertama kelompok seterusnya. */
  masaSeterusnya(): number {
    return this.tSeterusnya;
  }

  /** Semua kelompok untuk tempoh_s (ujian dan fixture). */
  jana(tempoh_s: number): MetrikSdk[] {
    const out: MetrikSdk[] = [];
    while (this.tSeterusnya < this.t0 + tempoh_s * US) out.push(this.seterusnya());
    return out;
  }
}

/** Sumber `sim` masa nyata: satu kelompok setiap `kelompok_ms` (UI dan Playwright). */
export class SumberSim implements Sumber {
  readonly jenis = "sim" as const;
  private pendengar: ((m: MetrikSdk) => void) | null = null;
  private pemasa: ReturnType<typeof setInterval> | null = null;

  constructor(
    private readonly kfg: KonfigSim,
    private readonly jam: () => number = () => Date.now() * 1000,
  ) {}

  onMetrik(f: (m: MetrikSdk) => void): () => void {
    this.pendengar = f;
    return () => {
      if (this.pendengar === f) this.pendengar = null;
    };
  }

  async mula(): Promise<void> {
    if (this.pemasa) return;
    const penjana = new PenjanaSim(this.kfg, this.jam());
    this.pemasa = setInterval(() => {
      while (penjana.masaSeterusnya() < this.jam()) this.pendengar?.(penjana.seterusnya());
    }, this.kfg.kelompok_ms);
  }

  async henti(): Promise<void> {
    if (this.pemasa) clearInterval(this.pemasa);
    this.pemasa = null;
  }
}
