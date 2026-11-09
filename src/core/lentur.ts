// LENTUR hidup + keputusan (PRD §4.2, §4.5): pengumpul nafas/PRQ/nadi dari payload, segmen fasa untuk lorek jalur IBI,
// dan baris kad keputusan (kunci lang + nilai) yang dikongsi skrin dan PNG. Tulen: tiada DOM, tiada SDK. Masa µs epoch.
import { keNombor, senarai, type MetrikSdk, type UkuranKeyakinan } from "./metrik.js";
import { licinNafas, type HasilLentur, type KonfigLentur, type SampelNafas } from "./rsa.js";
import type { HasilSkor } from "./score.js";

export interface NilaiStabil {
  t: number;
  v: number;
  stabil: boolean;
}

/** Stabil = medan `stable` SDK (jika ada) DAN keyakinan ≥ ambang; tiada `stable` = keyakinan sahaja. */
function stabilPada(u: UkuranKeyakinan, keyakinanMin: number): boolean {
  const c = u.confidence ?? 0;
  return typeof u.stable === "boolean" ? u.stable && c >= keyakinanMin : c >= keyakinanMin;
}

/**
 * Kumpul `breathing.upperTrace`, `pulse.pulseRespirationQuotient` dan nadi (`cardio.pulseRate`/`pulse.rate`) untuk LENTUR dan
 * kad keputusan. Sampel lebih lama daripada `simpanS` sebelum sampel terbaharu dibuang (memori terhad sepanjang sesi).
 */
export class PengumpulLentur {
  private readonly _nafas: SampelNafas[] = [];
  private readonly _prq: NilaiStabil[] = [];
  private readonly _nadi: NilaiStabil[] = [];

  constructor(
    private readonly keyakinanMin: number,
    private readonly simpanS: number,
  ) {}

  tambahMetrik(m: MetrikSdk): void {
    for (const u of m.breathing?.upperTrace ?? []) {
      const t = keNombor(u.timestamp);
      if (t !== null && typeof u.value === "number" && Number.isFinite(u.value))
        this._nafas.push({ t, v: u.value, stabil: u.stable ?? true });
    }
    const ukuran = (ke: NilaiStabil[], xs: UkuranKeyakinan[]) => {
      for (const u of xs) {
        const t = keNombor(u.timestamp);
        if (t !== null && typeof u.value === "number" && Number.isFinite(u.value) && u.value > 0)
          ke.push({ t, v: u.value, stabil: stabilPada(u, this.keyakinanMin) });
      }
    };
    ukuran(this._prq, senarai(m.pulse?.pulseRespirationQuotient));
    ukuran(this._nadi, [...(m.cardio?.pulseRate ?? []), ...(m.pulse?.rate ?? [])]);
    this.pangkas();
  }

  private pangkas(): void {
    for (const xs of [this._nafas, this._prq, this._nadi] as { t: number }[][]) {
      const akhir = xs[xs.length - 1];
      if (!akhir) continue;
      const had = akhir.t - this.simpanS * 1e6;
      let i = 0;
      while (i < xs.length && xs[i]!.t < had) i++;
      if (i > 0) xs.splice(0, i);
    }
  }

  nafas(): readonly SampelNafas[] {
    return this._nafas;
  }

  /** PRQ dalam [mula, akhir) (untuk `ringkasPrq`). */
  prq(mula: number, akhir: number): NilaiStabil[] {
    return this._prq.filter((x) => x.t >= mula && x.t < akhir);
  }

  /** Purata nadi stabil (BPM, bulat) dalam [mula, akhir); null bila tiada ukuran stabil. */
  nadiPurata(mula: number, akhir: number): number | null {
    const xs = this._nadi.filter((x) => x.stabil && x.t >= mula && x.t < akhir);
    return xs.length ? Math.round(xs.reduce((a, x) => a + x.v, 0) / xs.length) : null;
  }
}

export type Fasa = "tarik" | "hembus";

export interface SegmenFasa {
  mula: number;
  akhir: number;
  fasa: Fasa;
}

/** Gabung segmen bersebelahan yang fasanya sama. */
function gabung(xs: SegmenFasa[]): SegmenFasa[] {
  const out: SegmenFasa[] = [];
  for (const x of xs) {
    const akhir = out[out.length - 1];
    if (akhir && akhir.fasa === x.fasa && Math.abs(akhir.akhir - x.mula) < 1) akhir.akhir = x.akhir;
    else out.push({ ...x });
  }
  return out;
}

/** Segmen fasa panduan (tarik `tarik_s`, kemudian hembus `hembus_s`) dari `mula` hingga `hingga`. */
export function segmenPanduan(mula: number, hingga: number, kfg: KonfigLentur): SegmenFasa[] {
  const out: SegmenFasa[] = [];
  const tarik = kfg.tarik_s * 1e6;
  const hembus = kfg.hembus_s * 1e6;
  for (let t = mula; t < hingga; t += tarik + hembus) {
    out.push({ mula: t, akhir: Math.min(hingga, t + tarik), fasa: "tarik" });
    if (t + tarik < hingga) out.push({ mula: t + tarik, akhir: Math.min(hingga, t + tarik + hembus), fasa: "hembus" });
  }
  return out;
}

/**
 * Segmen fasa untuk lorek jalur IBI (PRD §4.2): bila jejak nafas atas stabil dan sudah ada ≥ `nafas_kitaran_min` kitaran,
 * fasa sebenar diutamakan (cerun jejak dilicinkan: naik = tarik, turun = hembus); jika tidak, fasa panduan.
 */
export function segmenFasa(
  nafas: readonly SampelNafas[],
  mula: number,
  hingga: number,
  bolehJejak: boolean,
  kfg: KonfigLentur,
): { sumber: "jejak" | "panduan"; segmen: SegmenFasa[] } {
  const l = bolehJejak ? licinNafas(nafas, mula, hingga, kfg) : null;
  if (!l || l.t.length < 2) return { sumber: "panduan", segmen: segmenPanduan(mula, hingga, kfg) };
  const xs: SegmenFasa[] = [];
  for (let i = 1; i < l.t.length; i++)
    xs.push({ mula: l.t[i - 1]!, akhir: l.t[i]!, fasa: l.y[i]! >= l.y[i - 1]! ? "tarik" : "hembus" });
  return { sumber: "jejak", segmen: gabung(xs) };
}

/** Ringkasan sesi untuk skrin keputusan dan kad PNG (PRD §4.2 Keputusan). */
export interface Keputusan {
  /** null bila RASA tak cukup data. */
  skor: number | null;
  jalur: string | null;
  N: number;
  n: number;
  lambatMs: number | null;
  prq: number | null;
  nadiPurata: number | null;
  /** Tarikh tempatan ISO (YYYY-MM-DD). */
  tarikh: string;
}

export function binaKeputusan(
  skor: HasilSkor | null,
  lentur: HasilLentur | null,
  nadiPurata: number | null,
  tarikh: string,
): Keputusan {
  return {
    skor: skor?.cukup ? skor.skor : null,
    jalur: skor?.cukup ? skor.jalur : null,
    N: skor?.N ?? 0,
    n: skor?.n ?? 0,
    lambatMs: lentur?.ringkasanMs ?? null,
    prq: lentur?.prq ?? null,
    nadiPurata,
    tarikh,
  };
}

/** Satu baris kad: label (kunci lang) + nilai (kunci lang + pemegang) atau null = "tiada" (`keputusan.tiada`). */
export interface BarisKad {
  id: "kiraan" | "lambat" | "prq" | "nadi";
  label: string;
  nilai: { kunci: string; nilai: Record<string, string | number> } | null;
}

/** Baris kad dalam susunan tetap; skrin dan PNG memakai fungsi yang sama supaya kandungan sentiasa sepadan. */
export function barisKad(k: Keputusan): BarisKad[] {
  return [
    { id: "kiraan", label: "keputusan.kiraan", nilai: { kunci: "keputusan.kiraan_nilai", nilai: { N: k.N, n: k.n } } },
    { id: "lambat", label: "keputusan.lambat", nilai: k.lambatMs === null ? null : { kunci: "keputusan.ms", nilai: { ms: k.lambatMs } } },
    { id: "prq", label: "keputusan.prq", nilai: k.prq === null ? null : { kunci: "keputusan.prq_nilai", nilai: { prq: k.prq } } },
    { id: "nadi", label: "keputusan.nadi", nilai: k.nadiPurata === null ? null : { kunci: "keputusan.bpm", nilai: { bpm: k.nadiPurata } } },
  ];
}

/** Tarikh tempatan YYYY-MM-DD dari Date (bukan UTC: kad menunjukkan hari pengguna). */
export function tarikhTempatan(d: Date): string {
  const p = (x: number) => String(x).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
