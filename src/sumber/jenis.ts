// Antara muka sama untuk semua sumber isyarat (PRD §4.10): live | replay | sim.
import type { MetrikSdk } from "../core/metrik.js";

export type JenisSumber = "live" | "replay" | "sim";

export interface Sumber {
  readonly jenis: JenisSumber;
  /** Daftar SATU pendengar payload metrik; pulangkan fungsi nyahdaftar. */
  onMetrik(f: (m: MetrikSdk) => void): () => void;
  mula(): Promise<void>;
  henti(): Promise<void>;
}
