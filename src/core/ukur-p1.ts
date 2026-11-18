// Ukuran gerbang P1 (PRD §2 H1, H2): ringkasan angka dari aliran payload `metrics` SDK atas video pemilik, dan keputusan
// "mod penuh" atau "R2" (PRD §7). Tulen: tiada DOM, tiada SDK, tiada fail. Semua ambang dari `config.p1`.
import { PengesanDegupan, type KonfigBeats } from "./beats.js";
import { keNombor, type MetrikSdk, type UkuranKeyakinan } from "./metrik.js";

export interface KonfigP1 {
  /** Saat pertama (dari metrik pertama) yang tidak dikira untuk H1/H2 (PRD §2 H1: "selepas 15 s pertama"). */
  abai_awal_s: number;
  /** H1: pecahan minimum sampel `pulseRate` yang `stable`. */
  stabil_min: number;
  /** H2: ralat relatif maksimum degupan dikesan lawan purata `pulseRate` × tempoh. */
  toleransi_degupan: number;
  /** H2: CV maksimum sela degupan. */
  cv_maks: number;
  /** H2: jurang maksimum antara degupan berturut (saat). */
  jurang_maks_s: number;
}

export interface PeristiwaPengesahan {
  kod: number;
  t: number;
}

/** Keluaran `headless-smoke` (angka sahaja; tiada kunci, tiada laluan, tiada imej). */
export interface RingkasanP1 {
  skema: 1;
  sdk_versi: string;
  status_akhir: number | null;
  ralat: { kod: number; boleh_ulang: boolean }[];
  masa_ke_metrik_pertama_ms: number | null;
  payload_metrik: number;
  insight: number;
  /** Peralihan kod `validationStatus` (kod berubah sahaja) + kiraan setiap kod. */
  pengesahan: { peralihan: PeristiwaPengesahan[]; kiraan: Record<string, number> };
  nadi: { sampel: number; sampel_dinilai: number; stabil: number; peratus_stabil: number | null; purata_bpm: number | null };
  nafas: { sampel: number; purata_per_min: number | null };
  degupan: {
    tempoh_s: number | null;
    dikesan: number;
    dijangka: number | null;
    ralat_relatif: number | null;
    cv_sela: number | null;
    jurang_maks_s: number | null;
  };
}

const bulat = (x: number, dp: number) => Math.round(x * 10 ** dp) / 10 ** dp;
const stabilKah = (u: UkuranKeyakinan, cMin: number) =>
  typeof u.stable === "boolean" ? u.stable : (u.confidence ?? 0) >= cMin;

/** Pengumpul aliran: suap setiap peristiwa SDK, kemudian `ringkasan()`. */
export class PengumpulP1 {
  private readonly pengesan: PengesanDegupan;
  private readonly nadi: { t: number; v: number; s: boolean }[] = [];
  private readonly nafas: number[] = [];
  private readonly jejakT: number[] = [];
  private readonly peralihan: PeristiwaPengesahan[] = [];
  private readonly kiraanKod: Record<string, number> = {};
  private readonly ralat: { kod: number; boleh_ulang: boolean }[] = [];
  private payload = 0;
  private insight = 0;
  private status: number | null = null;
  private tMulaMs: number | null = null;
  private tMetrikPertamaMs: number | null = null;

  constructor(
    private readonly beats: KonfigBeats,
    private readonly kfg: KonfigP1,
    private readonly sdkVersi: string,
  ) {
    this.pengesan = new PengesanDegupan(beats);
  }

  mula(jamMs: number): void {
    this.tMulaMs = jamMs;
  }

  metrik(m: MetrikSdk, jamMs: number): void {
    this.payload++;
    if (this.tMetrikPertamaMs === null) this.tMetrikPertamaMs = jamMs;
    for (const u of m.cardio?.pulseRate ?? []) {
      const t = keNombor(u.timestamp);
      if (t !== null && typeof u.value === "number" && u.value > 0)
        this.nadi.push({ t, v: u.value, s: stabilKah(u, this.beats.keyakinan_stabil) });
    }
    for (const u of m.breathing?.rate ?? []) if (typeof u.value === "number" && u.value > 0) this.nafas.push(u.value);
    for (const u of m.cardio?.arterialPressureTrace ?? []) {
      const t = keNombor(u.timestamp);
      if (t !== null) this.jejakT.push(t);
    }
    this.pengesan.tambahMetrik(m);
  }

  pengesahan(kod: number, tUs: number): void {
    this.kiraanKod[kod] = (this.kiraanKod[kod] ?? 0) + 1;
    if (this.peralihan.at(-1)?.kod !== kod) this.peralihan.push({ kod, t: tUs });
  }

  statusPemprosesan(s: number): void {
    this.status = s;
  }

  ralatSdk(kod: number, bolehUlang: boolean): void {
    this.ralat.push({ kod, boleh_ulang: bolehUlang });
  }

  insightTiba(): void {
    this.insight++;
  }

  ringkasan(): RingkasanP1 {
    const t0 = Math.min(this.nadi[0]?.t ?? Infinity, this.jejakT[0] ?? Infinity);
    const tAbai = Number.isFinite(t0) ? t0 + this.kfg.abai_awal_s * 1e6 : Infinity;
    const nadiNilai = this.nadi.filter((n) => n.t >= tAbai);
    const stabil = nadiNilai.filter((n) => n.s).length;
    const purata = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
    const bpm = purata(nadiNilai.map((n) => n.v));

    const jejakNilai = this.jejakT.filter((t) => t >= tAbai);
    const tempohS = jejakNilai.length > 1 ? (jejakNilai.at(-1)! - jejakNilai[0]!) / 1e6 : null;
    const deg = this.pengesan.degupan().filter((d) => d.t >= tAbai).map((d) => d.t).sort((a, b) => a - b);
    const sela = deg.slice(1).map((t, i) => (t - deg[i]!) / 1e6);
    const purataSela = purata(sela);
    const cv =
      purataSela && sela.length > 1
        ? Math.sqrt(sela.reduce((a, s) => a + (s - purataSela) ** 2, 0) / (sela.length - 1)) / purataSela
        : null;
    const dijangka = bpm !== null && tempohS !== null ? (bpm * tempohS) / 60 : null;

    return {
      skema: 1,
      sdk_versi: this.sdkVersi,
      status_akhir: this.status,
      ralat: this.ralat,
      masa_ke_metrik_pertama_ms:
        this.tMulaMs !== null && this.tMetrikPertamaMs !== null ? Math.round(this.tMetrikPertamaMs - this.tMulaMs) : null,
      payload_metrik: this.payload,
      insight: this.insight,
      pengesahan: { peralihan: this.peralihan, kiraan: this.kiraanKod },
      nadi: {
        sampel: this.nadi.length,
        sampel_dinilai: nadiNilai.length,
        stabil,
        peratus_stabil: nadiNilai.length ? bulat((100 * stabil) / nadiNilai.length, 1) : null,
        purata_bpm: bpm === null ? null : bulat(bpm, 1),
      },
      nafas: { sampel: this.nafas.length, purata_per_min: (() => { const p = purata(this.nafas); return p === null ? null : bulat(p, 1); })() },
      degupan: {
        tempoh_s: tempohS === null ? null : bulat(tempohS, 2),
        dikesan: deg.length,
        dijangka: dijangka === null ? null : bulat(dijangka, 1),
        ralat_relatif: dijangka ? bulat((deg.length - dijangka) / dijangka, 3) : null,
        cv_sela: cv === null ? null : bulat(cv, 3),
        jurang_maks_s: sela.length ? bulat(Math.max(...sela), 2) : null,
      },
    };
  }
}

export interface KeputusanP1 {
  h1: boolean;
  h2: boolean;
  mod: "penuh" | "R2";
  /** Kod sebab gagal (tetap, untuk log dan ujian): cth "h1_stabil", "h2_cv". */
  sebab: string[];
}

/** Gerbang P1: H1 (nadi + nafas muncul, `stable` ≥ ambang) dan H2 (±toleransi, CV, jurang). H1 atau H2 gagal = R2. */
export function nilaiP1(r: RingkasanP1, k: KonfigP1): KeputusanP1 {
  const sebab: string[] = [];
  if (r.ralat.length) sebab.push("h1_ralat_sdk");
  if (!r.nadi.sampel) sebab.push("h1_tiada_nadi");
  if (!r.nafas.sampel) sebab.push("h1_tiada_nafas");
  if (r.nadi.peratus_stabil === null || r.nadi.peratus_stabil < 100 * k.stabil_min) sebab.push("h1_stabil");
  const h1 = sebab.length === 0;
  const d = r.degupan;
  if (d.ralat_relatif === null || Math.abs(d.ralat_relatif) > k.toleransi_degupan) sebab.push("h2_bilangan");
  if (d.cv_sela === null || d.cv_sela >= k.cv_maks) sebab.push("h2_cv");
  if (d.jurang_maks_s === null || d.jurang_maks_s > k.jurang_maks_s) sebab.push("h2_jurang");
  const h2 = sebab.every((s) => !s.startsWith("h2_"));
  return { h1, h2, mod: h1 && h2 ? "penuh" : "R2", sebab };
}
