// Pulse tracker for See: current `cardio.pulseRate`, the SDK confidence for the ring, and how long the reading has been stable.
// See shows Ready once the reading stays stable for the time set in config.
// Penjejak nadi untuk LIHAT (PRD §4.2): BPM semasa, keyakinan (cincin), dan sejak bila jejak stabil ("Sedia" selepas N s).
// Tulen: tiada DOM, tiada SDK. Masa µs epoch.
import { keNombor, type MetrikSdk } from "./metrik.js";

export interface KeadaanNadi {
  bpm: number | null;
  /** 0 hingga 100 (keyakinan SDK). */
  keyakinan: number;
  stabil: boolean;
}

export class PenjejakStabil {
  private nadi: KeadaanNadi = { bpm: null, keyakinan: 0, stabil: false };
  private sejak: number | null = null;

  /** `keyakinanMin` = ambang stabil SDK untuk nadi (FAKTA §4.2: ≥ 40) bila payload tiada medan `stable`. */
  constructor(private readonly keyakinanMin: number) {}

  tambahMetrik(m: MetrikSdk): void {
    for (const p of m.cardio?.pulseRate ?? []) {
      if (typeof p.value !== "number" || p.value <= 0) continue;
      const c = p.confidence ?? 0;
      const stabil = typeof p.stable === "boolean" ? p.stable && c >= this.keyakinanMin : c >= this.keyakinanMin;
      const t = keNombor(p.timestamp);
      this.nadi = { bpm: p.value, keyakinan: c, stabil };
      if (!stabil) this.sejak = null;
      else if (this.sejak === null && t !== null) this.sejak = t;
    }
  }

  /** Petunjuk SDK bukan OK (muka hilang, gerak): kiraan stabil bermula semula. */
  putus(): void {
    this.sejak = null;
  }

  get keadaan(): KeadaanNadi {
    return this.nadi;
  }

  /** Saat jejak stabil berterusan hingga `kini` (µs); 0 bila tidak stabil. */
  stabilSelamaS(kini: number): number {
    return this.sejak === null ? 0 : Math.max(0, (kini - this.sejak) / 1e6);
  }
}
