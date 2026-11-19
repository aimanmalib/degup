// Petunjuk kesediaan SDK (`validationStatus`) → kunci i18n, dan penjejak jeda babak (PRD §4.1, PH§5.5 K2). Tulen: tiada DOM, tiada SDK.
// Kod ialah nilai `ValidationCode` @smartspectra/node-sdk 3.4.0 (js/index.d.ts); `tests/babak-teras.test.ts` membandingkan
// `KOD_SDK` dengan enum pakej. Hint Inggeris SDK tidak dipapar: BM perlu terjemahan, jadi teks datang dari lang/ ikut kod.

/** Nama `ValidationCode` SDK 3.4.0 → nilai (config menamakan kod, bukan nombor). */
export const KOD_SDK: Readonly<Record<string, number>> = {
  kOk: 0,
  kNoFaceFound: 1,
  kMultipleFacesFound: 2,
  kFaceNotCentered: 3,
  kFaceSizeOutOfRange: 4,
  kTooDark: 5,
  kTooBright: 6,
  kChestNotVisible: 7,
  kCameraTuning: 10,
  kFrameRateTooLow: 11,
  kExcessiveMotion: 12,
  kFaceTooClose: 13,
  kFaceTooFar: 14,
  kFaceTooHigh: 15,
  kFaceTooLow: 16,
  kFaceNotForward: 17,
};

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

/** `config/app.json` `petunjuk` (masa sudah didarab skala ujian oleh pemanggil). */
export interface KonfigJeda {
  /** Kod kritikal berterusan lebih lama dari ini (s) → jeda. Kelipan OK lebih pendek dari `sambung_selepas_ok_s` tidak memutuskannya. */
  jeda_selepas_bukan_ok_s: number;
  /** Jeda tamat bila tiada kod kritikal selama ini (s). */
  sambung_selepas_ok_s: number;
  /** Teks petunjuk bertukar paling kerap sekali setiap N s. */
  tukar_teks_min_s: number;
  /** Nama `ValidationCode` yang menjeda. Kod tidak dikenali (bukan OK, bukan nasihat) juga kritikal. */
  kritikal: readonly string[];
  /** Nama `ValidationCode` yang dipapar sebagai nasihat TANPA jeda (mutu sampel ditapis `confidence`/`stable`). */
  nasihat: readonly string[];
}

/** Nama kod dalam config yang tiada dalam `KOD_SDK` (ujian menolak config begitu). */
export function namaKodTakDikenali(k: Pick<KonfigJeda, "kritikal" | "nasihat">): string[] {
  return [...k.kritikal, ...k.nasihat].filter((n) => !(n in KOD_SDK));
}

/**
 * Jeda dengan histeresis (PH§5.5 K2). Masa µs epoch dari cap SDK; `detik` memajukan masa bila tiada peristiwa baharu.
 * - Jeda bila kod kritikal muncul dan masa sejak kod kritikal PERTAMA spel itu > `jeda_selepas_bukan_ok_s`; spel hanya
 *   tamat bila tiada kod kritikal selama `sambung_selepas_ok_s` (kelipan OK pendek tidak memulakannya semula).
 * - Sambung bila tiada kod kritikal selama `sambung_selepas_ok_s`.
 * - Kod nasihat tidak menjeda; ia hanya dipapar. Kod papar bertukar paling kerap sekali setiap `tukar_teks_min_s`.
 */
export class PenjejakJeda {
  private readonly nasihat: ReadonlySet<number>;
  private kod = KOD_OK;
  private t = -Infinity;
  /** Masa kod kritikal pertama spel semasa; null = tiada spel. */
  private mulaSpel: number | null = null;
  /** Masa sejak kod bukan kritikal (OK/nasihat) berterusan; null = kod semasa kritikal. */
  private sejakBersih: number | null = null;
  private mulaJeda: number | null = null;
  private papar = KOD_OK;
  private tPapar = -Infinity;
  /** Masa kod OK berterusan (untuk menyembunyikan petunjuk); null = kod semasa bukan OK. */
  private sejakOk: number | null = null;

  constructor(private readonly kfg: KonfigJeda) {
    this.nasihat = new Set(kfg.nasihat.map((n) => KOD_SDK[n]!).filter((n) => n !== undefined));
  }

  /** Kod kritikal = bukan OK dan bukan nasihat (termasuk kod tidak dikenali). */
  kritikal(kod: number): boolean {
    return kod !== KOD_OK && !this.nasihat.has(kod);
  }

  /** Kod baharu dari SDK pada masa `t` (µs). Pulang true bila keadaan jeda ATAU kod papar berubah. */
  kemas(kod: number, t: number): boolean {
    const tt = Math.max(t, this.t);
    if (this.kritikal(kod)) {
      this.sejakBersih = null;
      if (this.mulaSpel === null) this.mulaSpel = tt;
    } else if (this.sejakBersih === null) {
      this.sejakBersih = tt;
    }
    if (kod !== KOD_OK) this.sejakOk = null;
    else if (this.sejakOk === null) this.sejakOk = tt;
    this.kod = kod;
    return this.detik(tt);
  }

  /** Majukan masa tanpa kod baharu. Pulang true bila keadaan jeda ATAU kod papar berubah. */
  detik(t: number): boolean {
    this.t = Math.max(t, this.t);
    const kini = this.t;
    const dahulu = this.dijeda;
    const paparDahulu = this.papar;
    const k = this.kfg;
    if (this.sejakBersih !== null && kini - this.sejakBersih >= k.sambung_selepas_ok_s * 1e6) {
      this.mulaSpel = null;
      this.mulaJeda = null;
    }
    if (this.mulaJeda === null && this.mulaSpel !== null && kini - this.mulaSpel > k.jeda_selepas_bukan_ok_s * 1e6) {
      this.mulaJeda = kini;
      // Jeda ialah perubahan keadaan: teksnya terus menamakan kod kritikal.
      if (this.kritikal(this.kod)) this.tukarPapar(this.kod, kini);
    }
    this.kemasPapar(kini);
    return dahulu !== this.dijeda || paparDahulu !== this.papar;
  }

  private tukarPapar(kod: number, kini: number): void {
    if (kod === this.papar) return;
    this.papar = kod;
    this.tPapar = kini;
  }

  private kemasPapar(kini: number): void {
    const k = this.kfg;
    const bolehTukar = kini - this.tPapar >= k.tukar_teks_min_s * 1e6;
    if (this.kod !== KOD_OK) {
      if (bolehTukar) this.tukarPapar(this.kod, kini);
      return;
    }
    // OK: sembunyi hanya bila OK berterusan (tiada kelipan); dalam jeda kod kritikal terakhir kekal.
    if (this.dijeda || this.sejakOk === null) return;
    if (kini - this.sejakOk >= k.tukar_teks_min_s * 1e6 && bolehTukar) this.tukarPapar(KOD_OK, kini);
  }

  get dijeda(): boolean {
    return this.mulaJeda !== null;
  }

  /** Kod terkini dari SDK (mentah). */
  get kodSemasa(): number {
    return this.kod;
  }

  /** Kod yang dipapar (dihadkan kadar); OK = petunjuk tersembunyi. */
  get kodPapar(): number {
    return this.papar;
  }

  /** Tempoh data hilang (µs) sejak kod kritikal pertama spel yang menjadi jeda; 0 bila tidak dijeda. */
  tempohUs(kini: number): number {
    return this.mulaJeda === null || this.mulaSpel === null ? 0 : Math.max(0, kini - this.mulaSpel);
  }

  /** Jeda semasa melebihi had → pusingan RASA diulang (PRD §4.1). */
  perluUlang(kini: number, hadS: number): boolean {
    return this.tempohUs(kini) > hadS * 1e6;
  }
}
