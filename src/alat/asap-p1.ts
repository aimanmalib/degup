// Pelari asap headless P1 (PRD §2 H1, H2; PH§5.2 "Untuk P1"): SDK binding utama (`@smartspectra/node-sdk`) membaca video
// melalui `useFile()` + `start()`, setiap peristiwa disuap ke `PengumpulP1`. Node sahaja (bukan app). SDK disuntik supaya
// ujian memakai SDK tiruan tanpa kunci dan tanpa rangkaian. Opsyen SDK sama seperti app (`opsyenSdk`: cardio + breathing,
// telemetri MATI, output terkumpul MATI, satu pendengar `metrics`, tiada permintaan Insight).
import type { KonfigBeats } from "../core/beats.js";
import { PengumpulFixture, type Fixture } from "../core/fixture.js";
import type { MetrikSdk } from "../core/metrik.js";
import { PengumpulP1, type KonfigP1, type RingkasanP1 } from "../core/ukur-p1.js";
import { opsyenSdk, type OpsyenSdk } from "../sumber/live.js";
import { pasangPendengar } from "../sumber/pendengar.js";

/** Subset binding utama SDK yang dipakai di sini. Sengaja tiada kaedah permintaan Insight. */
export interface SdkFail {
  useFile(laluan: string, opsyen: OpsyenFail): unknown;
  start(): void;
  stopAsync(): Promise<void>;
  destroy(): Promise<void>;
  on(peristiwa: string, f: (...a: never[]) => void): unknown;
}

export interface OpsyenFail {
  interframeDelayMs: number;
  startOffsetMs: number;
  maxDurationMs: number;
}

export interface KilangSdkFail {
  cipta(opsyen: OpsyenSdk): SdkFail;
  nyahkod(buf: Uint8Array): MetrikSdk;
  kumpulan: Record<string, readonly number[]>;
  versi: string;
}

export interface ArgAsap {
  video: string;
  kunci: string;
  fail: OpsyenFail;
  /** Had masa dinding (ms): lebih = `stopAsync()` dan ringkasan apa yang ada. */
  hadMs: number;
  metrik: string[];
  beats: KonfigBeats;
  p1: KonfigP1;
  /** Kumpul fixture angka (`--fixture`). */
  fixture?: { skema: number; label: string; tarikh: string };
  jam?: () => number;
}

export interface HasilAsap {
  ringkasan: RingkasanP1;
  fixture: Fixture | null;
  tamatMasa: boolean;
}

/** `ProcessingStatus` (nilai stabil merentas versi SDK). */
const STATUS_REHAT = 1;
const STATUS_RALAT = 5;
/** kStarting, kRunning: kIdle selepas salah satunya = akhir fail. */
const DIMULA = new Set([2, 3]);

export async function jalankanAsap(k: KilangSdkFail, a: ArgAsap): Promise<HasilAsap> {
  const jam = a.jam ?? (() => performance.now());
  const kumpul = new PengumpulP1(a.beats, a.p1, k.versi);
  const fx = a.fixture ? new PengumpulFixture() : null;
  const sdk = k.cipta(opsyenSdk(a.kunci, { metrik: a.metrik }, k.kumpulan));

  let selesai!: (tamatMasa: boolean) => void;
  const tamat = new Promise<boolean>((r) => (selesai = r));
  let pernahMula = false;

  pasangPendengar(sdk, {
    metrik: (buf) => {
      let m: MetrikSdk;
      try {
        m = k.nyahkod(buf);
      } catch {
        return; // payload rosak dilangkau (sama seperti sumber live)
      }
      kumpul.metrik(m, jam());
      fx?.tambahMetrik(m);
    },
    pengesahan: (kod, tUs) => kumpul.pengesahan(kod, tUs),
    status: (s) => {
      kumpul.statusPemprosesan(s);
      if (DIMULA.has(s)) pernahMula = true;
      if (s === STATUS_RALAT || (s === STATUS_REHAT && pernahMula)) selesai(false);
    },
    insight: () => kumpul.insightTiba(),
    ralat: (kod, bolehUlang) => {
      kumpul.ralatSdk(kod, bolehUlang);
      if (!bolehUlang) selesai(false);
    },
  });

  const pemasa = setTimeout(() => selesai(true), a.hadMs);
  let tamatMasa = false;
  try {
    sdk.useFile(a.video, a.fail);
    kumpul.mula(jam());
    sdk.start();
    tamatMasa = await tamat;
  } catch (e) {
    // Kaedah kitaran hayat melontar `Error` berkod (index.d.ts); mesej tidak dicetak (boleh memetik konteks sesi).
    const kod = typeof (e as { code?: unknown }).code === "number" ? (e as { code: number }).code : -1;
    kumpul.ralatSdk(kod, false);
  } finally {
    clearTimeout(pemasa);
    await sdk.stopAsync().catch(() => undefined);
    await sdk.destroy().catch(() => undefined);
  }
  return {
    ringkasan: kumpul.ringkasan(),
    fixture: fx && a.fixture ? fx.keFixture({ skema: a.fixture.skema, jenis: "ujian", label: a.fixture.label, tarikh: a.fixture.tarikh }) : null,
    tamatMasa,
  };
}

/** Baca `SMARTSPECTRA_API_KEY` dari teks `.env` (tiada cetakan). Env proses menang. Kosong = null. */
export function kunciDariEnv(teksEnv: string | null, env: Record<string, string | undefined>): string | null {
  const dariProses = env.SMARTSPECTRA_API_KEY?.trim();
  if (dariProses) return dariProses;
  for (const baris of (teksEnv ?? "").split(/\r?\n/)) {
    const m = /^\s*(?:export\s+)?SMARTSPECTRA_API_KEY\s*=\s*(.*)$/.exec(baris);
    if (m) {
      const v = m[1]!.trim().replace(/^(['"])(.*)\1$/, "$2");
      return v || null;
    }
  }
  return null;
}
