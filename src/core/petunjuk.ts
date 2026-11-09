// Petunjuk kesediaan SDK (`validationStatus`) → kunci i18n, dan penjejak jeda babak (PRD §4.1). Tulen: tiada DOM, tiada SDK.
// Kod ialah nilai `ValidationCode` @smartspectra/node-sdk 3.4.0 (js/index.d.ts). Hint Inggeris SDK tidak dipapar: BM perlu
// terjemahan, jadi teks datang dari lang/ ikut kod.

/** Kod SDK → akhiran kunci `petunjuk.<x>` dalam lang/. Kod tidak dikenali → `petunjuk.lain`. */
export const KOD_PETUNJUK: Readonly<Record<number, string>> = {
  0: "ok",
  1: "tiada_muka",
  2: "banyak_muka",
  3: "muka_tengah",
  4: "jarak",
  5: "gelap",
  6: "terang",
  7: "dada",
  10: "kamera_tala",
  11: "bingkai",
  12: "gerak",
  13: "dekat",
  14: "jauh",
  15: "tinggi",
  16: "rendah",
  17: "hadap",
};

export const KOD_OK = 0;

export function kunciPetunjuk(kod: number): string {
  return `petunjuk.${KOD_PETUNJUK[kod] ?? "lain"}`;
}

/** Jeda bila kod terkini bukan OK; sambung bila OK. Masa µs epoch. */
export class PenjejakJeda {
  private kod = KOD_OK;
  private mulaJeda: number | null = null;

  /** Pulang true bila keadaan jeda berubah (mula atau tamat). */
  kemas(kod: number, t: number): boolean {
    const dahulu = this.dijeda;
    this.kod = kod;
    if (kod !== KOD_OK && this.mulaJeda === null) this.mulaJeda = t;
    if (kod === KOD_OK) this.mulaJeda = null;
    return dahulu !== this.dijeda;
  }

  get dijeda(): boolean {
    return this.mulaJeda !== null;
  }

  get kodSemasa(): number {
    return this.kod;
  }

  /** Tempoh jeda semasa (µs); 0 bila tidak dijeda. */
  tempohUs(kini: number): number {
    return this.mulaJeda === null ? 0 : Math.max(0, kini - this.mulaJeda);
  }

  /** Jeda semasa melebihi had → pusingan RASA diulang (PRD §4.1). */
  perluUlang(kini: number, hadS: number): boolean {
    return this.tempohUs(kini) > hadS * 1e6;
  }
}
