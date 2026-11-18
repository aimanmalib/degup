// Sumber `live` (PRD §4.10, §4.11; corak sampel rasmi `electron-quickstart`, dikreditkan dalam README dan 02-DECISIONS):
// renderer memiliki kamera (`getUserMedia`) dan menyerahkannya kepada SDK renderer melalui `useMediaStream`.
// SDK disuntik melalui `KilangSdk` supaya modul ini boleh diuji tanpa pakej asli (ujian memakai SDK tiruan).
// Konfigurasi dikunci: cardio + breathing sahaja, telemetri MATI, output terkumpul MATI, SATU pendengar `metrics`
// (Exhale: pendengar kedua menggantikan yang pertama), TIADA permintaan Insight atas arahan (K6/K7).
import type { MetrikSdk } from "../core/metrik.js";
import type { Sumber } from "./jenis.js";
import { pasangPendengar } from "./pendengar.js";
import { Pemancar } from "./pemancar.js";

/** Opsyen yang Degup hantar kepada pembina SDK. Tiada medan lain dibenarkan. */
export interface OpsyenSdk {
  apiKey: string;
  requestedMetrics: number[];
  enableTelemetry: false;
  enableAccumulatedOutput: false;
}

/** Subset SDK renderer yang Degup pakai (`@smartspectra/node-sdk/renderer`). Sengaja tiada kaedah permintaan Insight. */
export interface SdkRenderer {
  useMediaStream(strim: unknown): unknown;
  start(): Promise<void>;
  stop(): Promise<void>;
  destroy(): void;
  on(peristiwa: string, f: (...a: never[]) => void): unknown;
}

export interface KilangSdk {
  cipta(opsyen: OpsyenSdk): SdkRenderer;
  /** `decodeMetrics` dari `@smartspectra/node-sdk/messages`. */
  nyahkod(buf: Uint8Array): MetrikSdk;
  /** Kod metrik bagi kumpulan bernama dalam `config.sdk.metrik` (cth "cardio" → cardioMetrics). */
  kumpulan: Record<string, readonly number[]>;
}

/** Kumpulan yang dibenarkan PRD §4.11. Nama lain dalam config ditolak (muka, EDA, mikrogerak tidak pernah diminta). */
export const KUMPULAN_SAH = ["cardio", "breathing"] as const;

/** Bina opsyen SDK dari config. Kumpulan selain cardio/breathing = ralat (bukan diabaikan senyap). */
export function opsyenSdk(kunci: string, kfg: { metrik: string[] }, kumpulan: Record<string, readonly number[]>): OpsyenSdk {
  const diminta: number[] = [];
  for (const nama of kfg.metrik) {
    if (!(KUMPULAN_SAH as readonly string[]).includes(nama)) throw new Error(`metrik SDK tidak dibenarkan: ${nama}`);
    const kod = kumpulan[nama];
    if (!kod) throw new Error(`kumpulan metrik SDK tiada: ${nama}`);
    for (const k of kod) if (!diminta.includes(k)) diminta.push(k);
  }
  return { apiKey: kunci, requestedMetrics: diminta, enableTelemetry: false, enableAccumulatedOutput: false };
}

/** Kategori ralat SDK untuk UI (PRD §7: 429/kredit = minta kredit). Kod dari `SmartSpectraErrorCode`. */
export type RalatLive = "kunci" | "kredit" | "rangkaian" | "kamera" | "sdk";

export function kategoriRalat(kod: number): RalatLive {
  if (kod === 2) return "kunci"; // kAuthenticationFailed
  if (kod === 4) return "kredit"; // kCreditExhausted
  if (kod === 5 || kod === 6) return "rangkaian"; // kNetworkError, kServerError
  if (kod === 7) return "kamera"; // kInputUnavailable
  return "sdk";
}

/** Kunci lang ayat ralat yang skrin izin paparkan untuk kategori ini (`lang/*.json` `live.ralat_*`). */
export function kunciRalat(r: RalatLive): string {
  return `live.ralat_${r}`;
}

/** Peristiwa sesi yang dikira untuk panel Data (§4.6): diukur, bukan dakwaan. */
export interface KiraanLive {
  /** Bilangan payload `metrics` diterima. */
  metrik: number;
  /** true bila SDK mencapai kRunning (kunci diterima pelayan); false bila pengesahan gagal. */
  pengesahan: boolean | null;
  /** Peristiwa `insight` automatik (dikira sahaja; kandungan tidak dibaca, tiada permintaan Insight). */
  insight: number;
}

const STATUS_BERJALAN = 3; // ProcessingStatus.kRunning

export class SumberLive implements Sumber {
  readonly jenis = "live" as const;
  private readonly metrik = new Pemancar<[MetrikSdk]>();
  private readonly petunjuk = new Pemancar<[number, number]>();
  private readonly ralat = new Pemancar<[RalatLive]>();
  private readonly kira = new Pemancar<[KiraanLive]>();
  readonly onMetrik = this.metrik.dengar;
  readonly onPetunjuk = this.petunjuk.dengar;
  /** Ralat SDK (kunci ditolak, kredit habis, rangkaian, kamera). */
  readonly onRalat = this.ralat.dengar;
  /** Kiraan peristiwa berubah (panel Data). */
  readonly onKiraan = this.kira.dengar;
  readonly kiraan: KiraanLive = { metrik: 0, pengesahan: null, insight: 0 };
  private sdk: SdkRenderer | null = null;

  constructor(
    private readonly kilang: KilangSdk,
    private readonly opsyen: OpsyenSdk,
    private readonly strim: unknown,
  ) {}

  async mula(): Promise<void> {
    if (this.sdk) return;
    const sdk = this.kilang.cipta(this.opsyen);
    this.sdk = sdk;
    sdk.useMediaStream(this.strim);
    // SATU pendengar setiap peristiwa (`pasangPendengar`); sebaran ke sesi melalui Pemancar sendiri.
    pasangPendengar(sdk, {
      metrik: (buf) => {
        let m: MetrikSdk;
        try {
          m = this.kilang.nyahkod(buf);
        } catch {
          return; // payload rosak dilangkau; pengesan menganggapnya jurang
        }
        this.kiraan.metrik++;
        this.metrik.pancar(m);
      },
      pengesahan: (kod, tUs) => this.petunjuk.pancar(kod, tUs),
      status: (s) => {
        if (s === STATUS_BERJALAN && this.kiraan.pengesahan !== true) {
          this.kiraan.pengesahan = true;
          this.kira.pancar(this.kiraan);
        }
      },
      insight: () => {
        this.kiraan.insight++;
        this.kira.pancar(this.kiraan);
      },
      ralat: (kod) => {
        const k = kategoriRalat(kod);
        if (k === "kunci") {
          this.kiraan.pengesahan = false;
          this.kira.pancar(this.kiraan);
        }
        this.ralat.pancar(k);
      },
    });
    await sdk.start();
  }

  async henti(): Promise<void> {
    const sdk = this.sdk;
    this.sdk = null;
    if (!sdk) return;
    try {
      await sdk.stop();
    } catch {
      /* SDK sudah dalam keadaan ralat; destroy tetap dijalankan */
    }
    sdk.destroy();
  }
}
