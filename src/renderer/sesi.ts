// Sesi ukur renderer: SATU sumber (sim | replay; live = P4a) → pengesan degupan, penjejak nadi, penjejak jeda petunjuk.
// Babak (LIHAT, RASA, pendedahan) melanggan di sini; satu pendengar metrik sahaja dipasang pada sumber (perangkap SDK).
import { PengesanDegupan, type Degupan } from "../core/beats.js";
import { sahkanFixture } from "../core/fixture.js";
import type { MetrikSdk } from "../core/metrik.js";
import { PenjejakJeda } from "../core/petunjuk.js";
import { PenjejakStabil } from "../core/stabil.js";
import type { Sumber } from "../sumber/jenis.js";
import { SumberReplay } from "../sumber/replay.js";
import { SumberSim } from "../sumber/sim.js";
import type { Keadaan } from "./keadaan.js";

/** Masa sekarang µs epoch, asas sama dengan cap masa SDK (PRD §4.2). */
export function kiniUs(): number {
  return (performance.timeOrigin + performance.now()) * 1000;
}

/** Cap masa peristiwa input (µs epoch); `timeStamp` = masa peristiwa berlaku, bukan masa pengendali berjalan. */
export function masaPeristiwaUs(e: Event): number {
  return (performance.timeOrigin + e.timeStamp) * 1000;
}

/** Tetingkap RASA yang sedang berjalan (cangkuk ujian sim menyuntik ketukan melaluinya). */
export interface TetingkapRasa {
  mula: number;
  ketuk(t: number): void;
}

async function buatSumber(k: Keadaan): Promise<Sumber | null> {
  if (k.sumber === "sim") return new SumberSim(k.konfig.sim);
  if (k.sumber === "replay") {
    const fail = k.tetapan.fixture ?? k.mula.fixtures[0]?.fail;
    const data = fail ? await k.api.bacaFixture(fail) : null;
    const sah = data ? sahkanFixture(data, k.konfig.replay.skema) : null;
    if (!sah?.ok) return null;
    return new SumberReplay(sah.fixture, { kelompok_ms: k.konfig.replay.kelompok_ms, keyakinan_stabil: k.konfig.beats.keyakinan_stabil });
  }
  return null; // live: @smartspectra/node-sdk renderer, P4a
}

export class SesiUkur {
  readonly pengesan: PengesanDegupan;
  readonly nadi: PenjejakStabil;
  readonly jeda = new PenjejakJeda();
  rasa: TetingkapRasa | null = null;
  private readonly dengarDegupan = new Set<(d: Degupan) => void>();
  private readonly dengarJeda = new Set<() => void>();
  private lepas: Array<() => void> = [];

  private constructor(
    k: Keadaan,
    readonly sumber: Sumber | null,
  ) {
    this.pengesan = new PengesanDegupan(k.konfig.beats);
    this.nadi = new PenjejakStabil(k.konfig.beats.keyakinan_stabil);
  }

  static async cipta(k: Keadaan): Promise<SesiUkur> {
    const s = new SesiUkur(k, await buatSumber(k));
    if (s.sumber) {
      s.lepas.push(s.sumber.onMetrik((m) => s.terimaMetrik(m)));
      s.lepas.push(s.sumber.onPetunjuk((kod, t) => s.terimaPetunjuk(kod, t)));
      await s.sumber.mula();
    }
    return s;
  }

  private terimaMetrik(m: MetrikSdk): void {
    this.nadi.tambahMetrik(m);
    if (this.jeda.dijeda) this.nadi.putus();
    for (const d of this.pengesan.tambahMetrik(m)) for (const f of this.dengarDegupan) f(d);
  }

  terimaPetunjuk(kod: number, t: number): void {
    if (!this.jeda.kemas(kod, t)) return;
    if (this.jeda.dijeda) this.nadi.putus();
    for (const f of this.dengarJeda) f();
  }

  /** Ujian sim: petunjuk SDK tiruan. Sumber lain mengabaikannya. */
  suntikPetunjuk(kod: number): void {
    if (this.sumber instanceof SumberSim) this.sumber.suntikPetunjuk(kod);
  }

  onDegupan(f: (d: Degupan) => void): () => void {
    this.dengarDegupan.add(f);
    return () => this.dengarDegupan.delete(f);
  }

  onJeda(f: () => void): () => void {
    this.dengarJeda.add(f);
    return () => this.dengarJeda.delete(f);
  }

  async henti(): Promise<void> {
    for (const f of this.lepas) f();
    this.lepas = [];
    this.dengarDegupan.clear();
    this.dengarJeda.clear();
    await this.sumber?.henti();
  }
}
