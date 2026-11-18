// Sumber live (PRD §4.11, K6/K7) dengan SDK TIRUAN: konfigurasi tepat (cardio + breathing, telemetri mati, output terkumpul mati),
// SATU pendengar `metrics`, tiada `requestInsight`, ralat SDK dikategori, kiraan panel Data diukur.
import { describe, expect, it } from "vitest";
import app from "../config/app.json";
import en from "../lang/en.json";
import ms from "../lang/ms.json";
import type { MetrikSdk } from "../src/core/metrik";
import { kategoriRalat, kunciRalat, opsyenSdk, SumberLive, type KilangSdk, type OpsyenSdk, type SdkRenderer } from "../src/sumber/live";

// Kod rasmi SDK 3.4.0 (`constants.js`): bentuk sahaja, ujian tidak memuat pakej asli.
const KUMPULAN = { cardio: [15, 16, 17], breathing: [0, 1, 2, 3, 4, 5, 6, 7], face: [11, 12, 13, 14] };

class SdkTiruan {
  readonly pendengar = new Map<string, Array<(...a: unknown[]) => void>>();
  readonly panggilan: string[] = [];
  strim: unknown = null;
  constructor(readonly opsyen: OpsyenSdk) {}
  useMediaStream(s: unknown) {
    this.panggilan.push("useMediaStream");
    this.strim = s;
    return this;
  }
  async start() {
    this.panggilan.push("start");
  }
  async stop() {
    this.panggilan.push("stop");
  }
  destroy() {
    this.panggilan.push("destroy");
  }
  requestInsight(): Promise<number> {
    this.panggilan.push("requestInsight");
    return Promise.resolve(0);
  }
  on(p: string, f: (...a: unknown[]) => void) {
    // Tingkah laku SDK (Exhale): pendengar kedua untuk peristiwa yang sama MENGGANTIKAN yang pertama.
    this.pendengar.set(p, [...(this.pendengar.get(p) ?? []), f]);
    return this;
  }
  pancar(p: string, ...a: unknown[]) {
    const f = this.pendengar.get(p);
    f?.[f.length - 1]?.(...a);
  }
}

function bina() {
  const dicipta: SdkTiruan[] = [];
  const kilang: KilangSdk = {
    cipta: (o) => {
      const s = new SdkTiruan(o);
      dicipta.push(s);
      return s as unknown as SdkRenderer;
    },
    nyahkod: (buf) => JSON.parse(new TextDecoder().decode(buf)) as MetrikSdk,
    kumpulan: KUMPULAN,
  };
  const strim = { id: "strim-ujian" };
  const sumber = new SumberLive(kilang, opsyenSdk("kunci-ujian", app.sdk, KUMPULAN), strim);
  return { sumber, dicipta, strim };
}

const bait = (m: MetrikSdk) => new TextEncoder().encode(JSON.stringify(m));

describe("opsyenSdk", () => {
  it("config sebenar: cardio + breathing sahaja, telemetri MATI, output terkumpul MATI, tiada medan lain", () => {
    const o = opsyenSdk("k", app.sdk, KUMPULAN);
    expect(Object.keys(o).sort()).toEqual(["apiKey", "enableAccumulatedOutput", "enableTelemetry", "requestedMetrics"]);
    expect(o.enableTelemetry).toBe(false);
    expect(o.enableAccumulatedOutput).toBe(false);
    expect([...o.requestedMetrics].sort((a, b) => a - b)).toEqual([...KUMPULAN.breathing, ...KUMPULAN.cardio].sort((a, b) => a - b));
    for (const muka of KUMPULAN.face) expect(o.requestedMetrics).not.toContain(muka);
    expect(app.sdk.telemetri).toBe(false);
    expect(app.sdk.output_terkumpul).toBe(false);
  });

  it("menolak kumpulan selain cardio/breathing (muka, EDA) walaupun config menyebutnya", () => {
    expect(() => opsyenSdk("k", { metrik: ["cardio", "face"] }, KUMPULAN)).toThrow(/tidak dibenarkan/);
    expect(() => opsyenSdk("k", { metrik: ["eda"] }, KUMPULAN)).toThrow();
  });
});

describe("SumberLive (SDK tiruan)", () => {
  it("mula: strim hos ke useMediaStream SEBELUM start; tepat SATU pendengar metrics; tiada requestInsight", async () => {
    const { sumber, dicipta, strim } = bina();
    await sumber.mula();
    expect(dicipta).toHaveLength(1);
    const sdk = dicipta[0]!;
    expect(sdk.strim).toBe(strim);
    expect(sdk.panggilan).toEqual(["useMediaStream", "start"]);
    expect(sdk.pendengar.get("metrics")).toHaveLength(1);
    expect(sdk.pendengar.has("accumulatedMetrics")).toBe(false);
    await sumber.mula(); // idempoten: tiada SDK kedua, tiada pendengar kedua
    expect(dicipta).toHaveLength(1);
    expect(sdk.pendengar.get("metrics")).toHaveLength(1);
    await sumber.henti();
    expect(sdk.panggilan).toEqual(["useMediaStream", "start", "stop", "destroy"]);
    expect(sdk.panggilan).not.toContain("requestInsight");
  });

  it("payload metrics dinyahkod dan disebar; rosak dilangkau; petunjuk validationStatus disalur", async () => {
    const { sumber, dicipta } = bina();
    const dapat: MetrikSdk[] = [];
    const petunjuk: Array<[number, number]> = [];
    sumber.onMetrik((m) => dapat.push(m));
    sumber.onPetunjuk((k, t) => petunjuk.push([k, t]));
    await sumber.mula();
    const sdk = dicipta[0]!;
    const m: MetrikSdk = { cardio: { pulseRate: [{ value: 70, confidence: 80, stable: true, timestamp: 1_700_000_000_000_000 }] } };
    sdk.pancar("metrics", bait(m), 1);
    sdk.pancar("metrics", new Uint8Array([0xff, 0x00]), 2);
    sdk.pancar("validationStatus", 1, 1_700_000_000_500_000, "hint");
    expect(dapat).toEqual([m]);
    expect(sumber.kiraan.metrik).toBe(1);
    expect(petunjuk).toEqual([[1, 1_700_000_000_500_000]]);
  });

  it("kiraan Data: kRunning = pengesahan ya; insight automatik dikira; kunci ditolak = pengesahan tidak + ralat 'kunci'", async () => {
    const { sumber, dicipta } = bina();
    const ralat: string[] = [];
    sumber.onRalat((r) => ralat.push(r));
    await sumber.mula();
    const sdk = dicipta[0]!;
    expect(sumber.kiraan.pengesahan).toBeNull();
    sdk.pancar("processingStatus", 3);
    expect(sumber.kiraan.pengesahan).toBe(true);
    sdk.pancar("insight", new Uint8Array(), 7);
    expect(sumber.kiraan.insight).toBe(1);
    sdk.pancar("error", 2, "auth", false);
    expect(sumber.kiraan.pengesahan).toBe(false);
    sdk.pancar("error", 4, "credit", false);
    expect(ralat).toEqual(["kunci", "kredit"]);
  });

  it("stop gagal (SDK dalam kError) tetap memanggil destroy", async () => {
    const { sumber, dicipta } = bina();
    await sumber.mula();
    const sdk = dicipta[0]!;
    sdk.stop = async () => {
      throw new Error("kError");
    };
    await sumber.henti();
    expect(sdk.panggilan.at(-1)).toBe("destroy");
  });
});

describe("kategoriRalat (SmartSpectraErrorCode)", () => {
  it.each([
    [2, "kunci"],
    [4, "kredit"],
    [5, "rangkaian"],
    [6, "rangkaian"],
    [7, "kamera"],
    [8, "sdk"],
    [1, "sdk"],
  ])("kod %i → %s", (kod, jangka) => expect(kategoriRalat(kod)).toBe(jangka));
});

describe("ralat SDK semasa sesi → ayat skrin izin (P1a, SDK tiruan)", () => {
  const bacaKunci = (b: Record<string, unknown>, kunci: string) => kunci.split(".").reduce<unknown>((o, k) => (o as Record<string, unknown>)?.[k], b);
  it.each([
    [2, "live.ralat_kunci"],
    [4, "live.ralat_kredit"],
    [5, "live.ralat_rangkaian"],
    [6, "live.ralat_rangkaian"],
  ])("kod %i → %s, wujud dalam BM dan EN", async (kod, jangka) => {
    const { sumber, dicipta } = bina();
    const kunci: string[] = [];
    sumber.onRalat((r) => kunci.push(kunciRalat(r)));
    await sumber.mula();
    dicipta[0]!.pancar("error", kod, "mesej SDK", false);
    expect(kunci).toEqual([jangka]);
    for (const b of [en, ms]) expect(String(bacaKunci(b, jangka) ?? "").length).toBeGreaterThan(10);
  });
  it("kunci, kredit dan rangkaian ialah tiga ayat berbeza", () => {
    const t = (["kunci", "kredit", "rangkaian"] as const).map((r) => bacaKunci(en, kunciRalat(r)));
    expect(new Set(t).size).toBe(3);
  });
});

describe("larangan SDK dalam kod sumber (K6, K7)", () => {
  it("tiada panggilan requestInsight, tiada telemetri hidup, satu pendaftaran on(\"metrics\") dalam src/", async () => {
    const { readdirSync, readFileSync } = await import("node:fs");
    const { join } = await import("node:path");
    const fail = (readdirSync("src", { recursive: true }) as string[]).filter((f) => f.endsWith(".ts")).map((f) => join("src", f));
    const isi = fail.map((f) => readFileSync(f, "utf8").replace(/^\s*(\/\/|\*).*$/gm, ""));
    const semua = isi.join("\n");
    expect(semua).not.toMatch(/requestInsight\s*\(/);
    expect(semua).not.toMatch(/enableTelemetry:\s*true/);
    expect(semua).not.toMatch(/enableAccumulatedOutput:\s*true/);
    expect(semua.match(/\.on\(\s*"metrics"/g) ?? []).toHaveLength(1);
  });
});

describe("SumberLive onDiag (log diagnostik kit, J6a)", () => {
  it("hanya PERUBAHAN kod pengesahan/status, setiap kod ralat, metrik pertama sekali; tiada kunci dalam peristiwa", async () => {
    const { sumber, dicipta } = bina();
    const diag: unknown[] = [];
    sumber.onDiag((p) => diag.push(p));
    await sumber.mula();
    const sdk = dicipta[0]!;
    sdk.pancar("processingStatus", 3);
    sdk.pancar("processingStatus", 3);
    for (let i = 0; i < 5; i++) sdk.pancar("validationStatus", 1, i);
    sdk.pancar("validationStatus", 0, 9);
    sdk.pancar("metrics", bait({}), 1);
    sdk.pancar("metrics", bait({}), 2);
    sdk.pancar("error", 4, "mesej SDK dengan kunci-ujian", false);
    const jenis = diag.map((p) => (p as { jenis: string }).jenis);
    expect(jenis).toEqual(["status", "pengesahan", "pengesahan", "metrik_pertama", "ralat"]);
    expect(diag[0]).toEqual({ jenis: "status", kod: 3 });
    expect(diag[4]).toEqual({ jenis: "ralat", kod: 4, boleh_ulang: false });
    expect((diag[3] as { ms: number }).ms).toBeGreaterThanOrEqual(0);
    expect(JSON.stringify(diag)).not.toContain("kunci-ujian");
  });
});
