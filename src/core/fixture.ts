// Fixture main semula (PRD §4.10): {meta, jejak[{t,v,c}], nadi[{t,v,c}], nafas[{t,v}], kadar_nafas[{t,v,c}], ketukan[t]}.
// Skema 2 (J1): siri ikut medan `Metrics` 3.4.0 sebenar (cardio.*, breathing.*); nisbah degupan/nafas dikira, tidak disimpan.
// ANGKA SAHAJA: pengesah menolak kunci asing dan rentetan dalam data (tiada imej, tiada video, tiada laluan fail).
// Tulen: tiada DOM, tiada SDK, tiada fs. Masa µs epoch.
import { keNombor, type MetrikSdk, type UkuranKeyakinan } from "./metrik.js";

export type JenisFixture = "simulasi" | "pemilik" | "ujian";

export interface MetaFixture {
  skema: number;
  jenis: JenisFixture;
  /** Label bebas pendek (cth "sim-contoh", "18 Nov"); UI memaparkan label + jenis dari lang. */
  label: string;
  /** Tarikh sesi ISO (YYYY-MM-DD). */
  tarikh: string;
  /** Babak relatif sampel pertama, saat: [mula, akhir). Pilihan. */
  babak?: Partial<Record<"lihat" | "rasa" | "lentur", [number, number]>>;
  /** Parameter penjana bila jenis = simulasi (ujian boleh menjana semula). */
  jana?: Record<string, number>;
}

export interface TitikKeyakinan {
  t: number;
  v: number;
  c: number;
}

export interface TitikNafas {
  t: number;
  v: number;
  /** Stabil (diwarisi dari kadar nafas SDK); tiada = dianggap stabil. */
  s?: boolean;
}

export interface Fixture {
  meta: MetaFixture;
  jejak: TitikKeyakinan[];
  nadi: TitikKeyakinan[];
  nafas: TitikNafas[];
  /** `breathing.rate` (nafas/min) dengan keyakinan. */
  kadar_nafas: TitikKeyakinan[];
  ketukan: number[];
}

const KUNCI_ATAS = ["meta", "jejak", "nadi", "nafas", "kadar_nafas", "ketukan"] as const;
const KUNCI_META = ["skema", "jenis", "label", "tarikh", "babak", "jana"];
const JENIS: readonly JenisFixture[] = ["simulasi", "pemilik", "ujian"];
const LABEL_MAKS = 60;

export type HasilSah = { ok: true; fixture: Fixture } | { ok: false; ralat: string[] };

const objek = (x: unknown): x is Record<string, unknown> => typeof x === "object" && x !== null && !Array.isArray(x);
const nombor = (x: unknown): x is number => typeof x === "number" && Number.isFinite(x);
const julat = (v: unknown): v is [number, number] =>
  Array.isArray(v) && v.length === 2 && nombor(v[0]) && nombor(v[1]) && v[0] < v[1];

function semakSiri(nama: string, x: unknown, medan: readonly string[], pilihan: readonly string[], ralat: string[]): void {
  if (!Array.isArray(x)) {
    ralat.push(`${nama}: bukan senarai`);
    return;
  }
  let tAkhir = -Infinity;
  x.forEach((e, i) => {
    if (!objek(e)) return void ralat.push(`${nama}[${i}]: bukan objek`);
    for (const k of Object.keys(e))
      if (!medan.includes(k) && !pilihan.includes(k)) ralat.push(`${nama}[${i}]: kunci asing "${k}"`);
    for (const k of medan) if (!nombor(e[k])) ralat.push(`${nama}[${i}].${k}: bukan nombor`);
    if ("s" in e && typeof e.s !== "boolean") ralat.push(`${nama}[${i}].s: bukan boolean`);
    if ("c" in e && nombor(e.c) && (e.c < 0 || e.c > 100)) ralat.push(`${nama}[${i}].c: luar 0–100`);
    if (nombor(e.t)) {
      if (e.t < tAkhir) ralat.push(`${nama}[${i}].t: tidak menaik`);
      tAkhir = e.t;
    }
  });
}

/** Pengesah skema (P2b): pulangkan fixture bertaip atau senarai ralat. */
export function sahkanFixture(x: unknown, skema: number): HasilSah {
  const ralat: string[] = [];
  if (!objek(x)) return { ok: false, ralat: ["akar: bukan objek"] };
  for (const k of Object.keys(x)) if (!(KUNCI_ATAS as readonly string[]).includes(k)) ralat.push(`akar: kunci asing "${k}"`);

  const m = x.meta;
  if (!objek(m)) ralat.push("meta: bukan objek");
  else {
    for (const k of Object.keys(m)) if (!KUNCI_META.includes(k)) ralat.push(`meta: kunci asing "${k}"`);
    if (m.skema !== skema) ralat.push(`meta.skema: dijangka ${skema}`);
    if (!JENIS.includes(m.jenis as JenisFixture)) ralat.push(`meta.jenis: mesti ${JENIS.join("|")}`);
    if (typeof m.label !== "string" || m.label.length === 0 || m.label.length > LABEL_MAKS)
      ralat.push(`meta.label: rentetan 1–${LABEL_MAKS} aksara`);
    if (typeof m.tarikh !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(m.tarikh)) ralat.push("meta.tarikh: YYYY-MM-DD");
    if (m.babak !== undefined) {
      if (!objek(m.babak)) ralat.push("meta.babak: bukan objek");
      else
        for (const [k, v] of Object.entries(m.babak))
          if (!["lihat", "rasa", "lentur"].includes(k) || !julat(v)) ralat.push(`meta.babak.${k}: [mula, akhir] saat`);
    }
    if (m.jana !== undefined && (!objek(m.jana) || !Object.values(m.jana).every(nombor)))
      ralat.push("meta.jana: objek nombor sahaja");
  }

  semakSiri("jejak", x.jejak, ["t", "v", "c"], [], ralat);
  semakSiri("nadi", x.nadi, ["t", "v", "c"], [], ralat);
  semakSiri("nafas", x.nafas, ["t", "v"], ["s"], ralat);
  semakSiri("kadar_nafas", x.kadar_nafas, ["t", "v", "c"], [], ralat);
  if (!Array.isArray(x.ketukan) || !x.ketukan.every(nombor)) ralat.push("ketukan: senarai nombor");
  else if (x.ketukan.some((t, i, a) => i > 0 && t < a[i - 1]!)) ralat.push("ketukan: tidak menaik");
  if (Array.isArray(x.jejak) && x.jejak.length === 0) ralat.push("jejak: kosong");

  return ralat.length ? { ok: false, ralat } : { ok: true, fixture: x as unknown as Fixture };
}

/** Masa sampel pertama fixture (µs), asas anjakan main semula dan `meta.babak`. */
export function masaMula(f: Fixture): number {
  return Math.min(f.jejak[0]?.t ?? Infinity, f.nadi[0]?.t ?? Infinity, f.nafas[0]?.t ?? Infinity);
}

/** Babak µs epoch → saat relatif `t0` (meta.babak); julat kosong/terbalik dibuang. null = tiada babak sah. */
export function babakRelatif(
  babakUs: Partial<Record<"lihat" | "rasa" | "lentur", [number, number]>>,
  t0: number,
): MetaFixture["babak"] | null {
  const out: NonNullable<MetaFixture["babak"]> = {};
  for (const [k, j] of Object.entries(babakUs) as Array<["lihat" | "rasa" | "lentur", [number, number]]>) {
    const a = bulat((j[0] - t0) / 1e6, 2);
    const b = bulat((j[1] - t0) / 1e6, 2);
    if (b > a) out[k] = [a, b];
  }
  return Object.keys(out).length ? out : null;
}

/**
 * Fixture → payload berbentuk `decodeMetrics`, dikelompok `kelompok_ms`, cap masa dianjak `anjakUs`.
 * `stable` = keyakinan ≥ `keyakinanStabil` (config.beats.keyakinan_stabil).
 */
export function fixtureKeMetrik(
  f: Fixture,
  kelompok_ms: number,
  keyakinanStabil: number,
  anjakUs = 0,
): { tAkhir: number; m: MetrikSdk }[] {
  const t0 = masaMula(f);
  const lebar = kelompok_ms * 1000;
  const kelompok = new Map<number, MetrikSdk>();
  const ambil = (t: number) => {
    const k = Math.floor((t - t0) / lebar);
    let m = kelompok.get(k);
    if (!m) kelompok.set(k, (m = {}));
    return m;
  };
  for (const p of f.jejak)
    (((ambil(p.t).cardio ??= {}).arterialPressureTrace ??= []) as unknown[]).push({
      value: p.v, confidence: p.c, stable: p.c >= keyakinanStabil, timestamp: p.t + anjakUs,
    });
  for (const p of f.nadi)
    (((ambil(p.t).cardio ??= {}).pulseRate ??= []) as unknown[]).push({
      value: p.v, confidence: p.c, stable: p.c >= keyakinanStabil, timestamp: p.t + anjakUs,
    });
  for (const p of f.nafas)
    (((ambil(p.t).breathing ??= {}).upperTrace ??= []) as unknown[]).push({
      value: p.v, stable: p.s ?? true, timestamp: p.t + anjakUs,
    });
  for (const p of f.kadar_nafas)
    (((ambil(p.t).breathing ??= {}).rate ??= []) as unknown[]).push({
      value: p.v, confidence: p.c, stable: p.c >= keyakinanStabil, timestamp: p.t + anjakUs,
    });
  return [...kelompok.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([k, m]) => ({ tAkhir: t0 + (k + 1) * lebar + anjakUs, m }));
}

const bulat = (x: number, dp: number) => Math.round(x * 10 ** dp) / 10 ** dp;

/** Pengumpul fixture dari aliran payload (penjana sim; perakam fixture sumber live, sesi.ts). Angka sahaja. */
export class PengumpulFixture {
  private readonly f: Omit<Fixture, "meta"> = { jejak: [], nadi: [], nafas: [], kadar_nafas: [], ketukan: [] };

  tambahMetrik(m: MetrikSdk): void {
    const titik = (u: UkuranKeyakinan) => {
      const t = keNombor(u.timestamp);
      return t === null || !nombor(u.value) ? null : { t, v: bulat(u.value, 4), c: bulat(u.confidence ?? 0, 1) };
    };
    for (const u of m.cardio?.arterialPressureTrace ?? []) this.tolak(this.f.jejak, titik(u));
    for (const u of m.cardio?.pulseRate ?? []) this.tolak(this.f.nadi, titik(u));
    for (const u of m.breathing?.rate ?? []) this.tolak(this.f.kadar_nafas, titik(u));
    for (const u of m.breathing?.upperTrace ?? []) {
      const t = keNombor(u.timestamp);
      if (t !== null && nombor(u.value)) this.f.nafas.push({ t, v: bulat(u.value, 4), s: u.stable ?? false });
    }
  }

  tambahKetukan(t: number): void {
    this.f.ketukan.push(Math.round(t));
  }

  keFixture(meta: MetaFixture): Fixture {
    const ikutMasa = <T extends { t: number }>(xs: T[]) => [...xs].sort((a, b) => a.t - b.t);
    return {
      meta,
      jejak: ikutMasa(this.f.jejak),
      nadi: ikutMasa(this.f.nadi),
      nafas: ikutMasa(this.f.nafas),
      kadar_nafas: ikutMasa(this.f.kadar_nafas),
      ketukan: [...this.f.ketukan].sort((a, b) => a - b),
    };
  }

  private tolak(ke: TitikKeyakinan[], x: TitikKeyakinan | null): void {
    if (x) ke.push(x);
  }
}
