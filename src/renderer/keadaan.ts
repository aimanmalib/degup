// Keadaan app renderer: i18n, permulaan dari main, kiraan peristiwa sesi (panel Data §4.6), sumber berkesan.
import konfig from "../../config/app.json";
import en from "../../lang/en.json";
import ms from "../../lang/ms.json";
import { I18n } from "../core/i18n.js";
import type { DegupApi, Permulaan, Tetapan } from "../preload/api.js";

declare global {
  interface Window {
    degup: DegupApi;
  }
}

export type SumberBerkesan = "live" | "replay" | "sim";

export interface Sesi {
  /** null = SDK belum mengesahkan kunci dalam sesi ini. Diisi sumber live (P4a). */
  pengesahan: boolean | null;
  insight: number;
}

export class Keadaan {
  readonly api: DegupApi = window.degup;
  readonly i18n: I18n;
  readonly sesi: Sesi = { pengesahan: null, insight: 0 };
  readonly konfig = konfig;
  private pendengar: Array<() => void> = [];

  constructor(public mula: Permulaan) {
    this.i18n = new I18n({ ms, en }, mula.tetapan.bahasa, konfig.bahasa_lalai);
  }

  t = (kunci: string, nilai?: Record<string, string | number>) => this.i18n.t(kunci, nilai);

  get tetapan(): Tetapan {
    return this.mula.tetapan;
  }

  get sumber(): SumberBerkesan {
    const e = this.mula.sumberEnv;
    return e === "live" || e === "replay" || e === "sim" ? e : this.tetapan.sumber;
  }

  async ubah(ubah: Partial<Tetapan>): Promise<void> {
    this.mula.tetapan = await this.api.simpanTetapan(ubah);
    if (this.i18n.bahasa !== this.mula.tetapan.bahasa) this.i18n.tukar(this.mula.tetapan.bahasa);
    this.mula.failDitulis = await this.api.failDitulis();
    this.maklum();
  }

  /** Lukis semula UI selepas tetapan/bahasa berubah. */
  dengar(f: () => void): void {
    this.pendengar.push(f);
  }

  maklum(): void {
    document.documentElement.lang = this.i18n.bahasa;
    for (const f of this.pendengar) f();
  }
}
