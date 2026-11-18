// Abah-abah P1 (J5): pelari `useFile()` atas SDK TIRUAN yang memancarkan payload berbentuk `Metrics` 3.4.0 (dikod dengan pakej
// terpasang, dinyahkod dengan `decodeMetrics` sebenar), dan `scripts/gerbang-p1.mjs` atas JSON lulus / gagal. Tiada kunci, tiada rangkaian.
import { Metrics, decodeMetrics } from "@smartspectra/node-sdk/messages";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import app from "../config/app.json";
import { jalankanAsap, kunciDariEnv, type KilangSdkFail, type OpsyenFail, type SdkFail } from "../src/alat/asap-p1";
import type { KonfigBeats } from "../src/core/beats";
import type { MetrikSdk } from "../src/core/metrik";
import { nilaiP1, type KonfigP1, type RingkasanP1 } from "../src/core/ukur-p1";
import type { OpsyenSdk } from "../src/sumber/live";
import { PenjanaSim, type KonfigSim } from "../src/sumber/sim";

const T0 = 1_762_000_000_000_000;
const KUNCI = "kunci-ujian-jangan-cetak";
const KUMPULAN = { cardio: [15, 16, 17], breathing: [0, 2, 3] };
const P1 = app.p1 as KonfigP1;

type Pendengar = (...a: unknown[]) => void;

/** SDK tiruan: `start()` memancarkan skrip peristiwa secara tak segerak, seperti binding sebenar. */
class SdkTiruan implements SdkFail {
  readonly pendengar = new Map<string, Pendengar>();
  fail: { laluan: string; opsyen: OpsyenFail } | null = null;
  berhenti = 0;
  dimusnah = 0;
  constructor(private readonly skrip: (p: (e: string, ...a: unknown[]) => void) => Promise<void>) {}
  useFile(laluan: string, opsyen: OpsyenFail) {
    this.fail = { laluan, opsyen };
    return this;
  }
  start() {
    void this.skrip((e, ...a) => this.pendengar.get(e)?.(...a));
  }
  async stopAsync() {
    this.berhenti++;
  }
  async destroy() {
    this.dimusnah++;
  }
  on(e: string, f: (...a: never[]) => void) {
    if (this.pendengar.has(e)) throw new Error(`pendengar kedua untuk ${e}`); // Exhale: satu pendengar sahaja
    this.pendengar.set(e, f as Pendengar);
    return this;
  }
}

const kod = (m: MetrikSdk) => Buffer.from(Metrics.encode(Metrics.fromObject(m as Record<string, unknown>)).finish());
const rehat = () => new Promise((r) => setTimeout(r, 0));

function kilang(skrip: ConstructorParameters<typeof SdkTiruan>[0]) {
  const rekod: { opsyen: OpsyenSdk | null; sdk: SdkTiruan | null } = { opsyen: null, sdk: null };
  const k: KilangSdkFail = {
    cipta: (o) => ((rekod.opsyen = o), (rekod.sdk = new SdkTiruan(skrip))),
    nyahkod: (b) => decodeMetrics(b) as unknown as MetrikSdk,
    kumpulan: KUMPULAN,
    versi: app.sdk.versi,
  };
  return { k, rekod };
}

const arg = (lebih: Partial<Parameters<typeof jalankanAsap>[1]> = {}) => ({
  video: "/tiada/video.mp4",
  kunci: KUNCI,
  fail: { interframeDelayMs: 0, startOffsetMs: 0, maxDurationMs: 0 },
  hadMs: 5000,
  metrik: app.sdk.metrik,
  beats: app.beats as KonfigBeats,
  p1: P1,
  ...lebih,
});

/** Video "diam" 60 s: sim tanpa hanyut, SDK memancar kRunning, kNoFaceFound lalu kOk, payload, satu insight, kIdle. */
const skripDiam = (sim: Partial<KonfigSim> = {}) => async (p: (e: string, ...a: unknown[]) => void) => {
  p("processingStatus", 2);
  await rehat();
  p("processingStatus", 3);
  p("validationStatus", 1, T0, "");
  p("validationStatus", 0, T0 + 1e6, "");
  for (const m of new PenjanaSim({ ...(app.sim as KonfigSim), hanyut_bpm: 0, ...sim }, T0).jana(60)) {
    p("metrics", kod(m), 0);
    await rehat();
  }
  p("insight", Buffer.alloc(0), 0);
  p("processingStatus", 4);
  p("processingStatus", 1);
};

describe("jalankanAsap (SDK tiruan)", () => {
  it("opsyen SDK sama seperti app, useFile menerima opsyen, ringkasan H1/H2 lulus atas sim stabil", async () => {
    const { k, rekod } = kilang(skripDiam());
    const fail = { interframeDelayMs: 33, startOffsetMs: 1000, maxDurationMs: 20000 };
    const h = await jalankanAsap(k, arg({ fail, fixture: { skema: app.replay.skema, label: "host test video", tarikh: "2026-11-19" } }));
    expect(rekod.opsyen).toEqual({ apiKey: KUNCI, requestedMetrics: [15, 16, 17, 0, 2, 3], enableTelemetry: false, enableAccumulatedOutput: false });
    expect(rekod.sdk!.fail).toEqual({ laluan: "/tiada/video.mp4", opsyen: fail });
    expect([...rekod.sdk!.pendengar.keys()].sort()).toEqual(["error", "insight", "metrics", "processingStatus", "validationStatus"]);
    expect(rekod.sdk!.berhenti).toBe(1);
    expect(rekod.sdk!.dimusnah).toBe(1);
    expect(h.tamatMasa).toBe(false);

    const r = h.ringkasan;
    expect(r.status_akhir).toBe(1);
    expect(r.insight).toBe(1);
    expect(r.pengesahan.peralihan.map((x) => x.kod)).toEqual([1, 0]);
    expect(r.pengesahan.kiraan).toEqual({ 0: 1, 1: 1 });
    expect(r.masa_ke_metrik_pertama_ms).toBeGreaterThanOrEqual(0);
    expect(r.nadi.peratus_stabil).toBe(100);
    expect(r.nadi.purata_bpm).toBeCloseTo(app.sim.nadi_bpm, 0);
    expect(r.nafas.sampel).toBeGreaterThan(0);
    expect(Math.abs(r.degupan.ralat_relatif!)).toBeLessThan(P1.toleransi_degupan);
    expect(r.degupan.cv_sela!).toBeLessThan(P1.cv_maks);
    expect(nilaiP1(r, P1)).toEqual({ h1: true, h2: true, mod: "penuh", sebab: [] });

    expect(JSON.stringify(r)).not.toContain(KUNCI);
    expect(JSON.stringify(r)).not.toContain("video.mp4");
    expect(h.fixture!.meta).toEqual({ skema: app.replay.skema, jenis: "ujian", label: "host test video", tarikh: "2026-11-19" });
    expect(h.fixture!.jejak.length).toBeGreaterThan(1000);
  });

  it("keyakinan rendah = H1 gagal, keputusan R2", async () => {
    const { k } = kilang(skripDiam({ keyakinan: app.beats.keyakinan_stabil - 10 }));
    const h = await jalankanAsap(k, arg());
    expect(h.ringkasan.nadi.peratus_stabil).toBe(0);
    const kp = nilaiP1(h.ringkasan, P1);
    expect(kp.mod).toBe("R2");
    expect(kp.sebab).toContain("h1_stabil");
  });

  it("kunci ditolak (kod 2) direkod dan larian tamat tanpa menunggu had", async () => {
    const { k, rekod } = kilang(async (p) => {
      p("processingStatus", 2);
      await rehat();
      p("error", 2, "auth", false);
      p("processingStatus", 5);
    });
    const h = await jalankanAsap(k, arg({ hadMs: 60_000 }));
    expect(h.tamatMasa).toBe(false);
    expect(h.ringkasan.ralat).toEqual([{ kod: 2, boleh_ulang: false }]);
    expect(h.ringkasan.status_akhir).toBe(5);
    expect(rekod.sdk!.berhenti).toBe(1);
    expect(nilaiP1(h.ringkasan, P1).sebab).toContain("h1_ralat_sdk");
  });

  it("SDK senyap = tamat masa dinding, stopAsync tetap dipanggil", async () => {
    const { k, rekod } = kilang(async () => undefined);
    const h = await jalankanAsap(k, arg({ hadMs: 20 }));
    expect(h.tamatMasa).toBe(true);
    expect(h.ringkasan.payload_metrik).toBe(0);
    expect(rekod.sdk!.berhenti).toBe(1);
  });

  it("start() melontar Error berkod = ralat direkod, bukan lontaran", async () => {
    const { k } = kilang(async () => undefined);
    const asal = k.cipta;
    k.cipta = (o) => {
      const s = asal(o) as SdkTiruan;
      s.start = () => {
        throw Object.assign(new Error("no credits"), { code: 4 });
      };
      return s;
    };
    const h = await jalankanAsap(k, arg());
    expect(h.ringkasan.ralat).toEqual([{ kod: 4, boleh_ulang: false }]);
  });
});

describe("kunciDariEnv", () => {
  it("env proses menang; .env dibaca; petikan dibuang; kosong = null", () => {
    expect(kunciDariEnv("SMARTSPECTRA_API_KEY=a", { SMARTSPECTRA_API_KEY: "b" })).toBe("b");
    expect(kunciDariEnv("X=1\nexport SMARTSPECTRA_API_KEY=\"abc\"\n", {})).toBe("abc");
    expect(kunciDariEnv("SMARTSPECTRA_API_KEY=\n", {})).toBeNull();
    expect(kunciDariEnv(null, {})).toBeNull();
  });
});

describe("scripts/gerbang-p1.mjs", () => {
  const dir = mkdtempSync(join(tmpdir(), "degup-p1-"));
  afterAll(() => rmSync(dir, { recursive: true, force: true }));
  const lari = (fail: string) => spawnSync(process.execPath, ["scripts/gerbang-p1.mjs", fail], { encoding: "utf8" });
  const contoh = (lebih: Partial<RingkasanP1["degupan"]> = {}, stabil = 85): RingkasanP1 => ({
    skema: 1, sdk_versi: "3.4.0", status_akhir: 1, ralat: [], masa_ke_metrik_pertama_ms: 4000, payload_metrik: 600, insight: 0,
    pengesahan: { peralihan: [{ kod: 0, t: T0 }], kiraan: { 0: 1 } },
    nadi: { sampel: 300, sampel_dinilai: 250, stabil: Math.round(2.5 * stabil), peratus_stabil: stabil, purata_bpm: 70 },
    nafas: { sampel: 100, purata_per_min: 12 },
    degupan: { tempoh_s: 45, dikesan: 52, dijangka: 52.5, ralat_relatif: -0.01, cv_sela: 0.08, jurang_maks_s: 1.1, ...lebih },
  });
  const tulis = (nama: string, x: unknown) => {
    const f = join(dir, nama);
    writeFileSync(f, typeof x === "string" ? x : JSON.stringify(x));
    return f;
  };

  it("JSON lulus = rc 0 'mod penuh'", () => {
    const r = lari(tulis("lulus.json", contoh()));
    expect(r.status).toBe(0);
    expect(r.stdout.trim().split("\n").at(-1)).toBe("mod penuh");
  });

  it("JSON gagal (CV, jurang, stable) = rc 1 'R2' dengan sebab", () => {
    const r = lari(tulis("gagal.json", contoh({ cv_sela: 0.4, jurang_maks_s: 3.5 }, 50)));
    expect(r.status).toBe(1);
    expect(r.stdout).toContain("h1_stabil");
    expect(r.stdout).toContain("h2_cv");
    expect(r.stdout).toContain("h2_jurang");
    expect(r.stdout.trim().split("\n").at(-1)).toBe("R2");
  });

  it("bukan ringkasan / tiada fail = rc 2", () => {
    expect(lari(tulis("rosak.json", "{")).status).toBe(2);
    expect(lari(tulis("lain.json", { skema: 9 })).status).toBe(2);
    expect(lari(join(dir, "tiada.json")).status).toBe(2);
  });

  it("headless-smoke tanpa video = rc 2 sebelum SDK dimuat", () => {
    const r = spawnSync(process.execPath, ["scripts/headless-smoke.mjs"], { encoding: "utf8" });
    expect(r.status).toBe(2);
  });
});
