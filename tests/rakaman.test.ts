// Perakam demo + perakam fixture di proses main (PRD §4.9, §4.10) dan penyediaan SDK main (§4.11): fail dinamakan main,
// had saiz, rakaman kosong tidak meninggalkan fail, fixture hanya bila lulus pengesah (angka sahaja, tiada imej).
import { mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import app from "../config/app.json";
import { babakRelatif, masaMula, PengumpulFixture, sahkanFixture } from "../src/core/fixture";
import { PenulisRakaman, simpanFixtureRakaman } from "../src/main/rakaman";
import { laluanCapi, PengikatSdk, sediaPersekitaran } from "../src/main/sdk";
import { PenjanaSim } from "../src/sumber/sim";

let folder = "";
const baharu = () => (folder = mkdtempSync(join(tmpdir(), "degup-rakaman-")));
afterEach(() => rmSync(folder, { recursive: true, force: true }));
const HAD = { ketul_maks_bait: 8, jumlah_maks_bait: 12 };
const KINI = new Date(2026, 10, 18, 21, 5, 9);

describe("PenulisRakaman", () => {
  it("ketul ditambah ikut urutan, .part dinamakan semula .webm bila tamat", () => {
    const f = join(baharu(), "Degup");
    const p = new PenulisRakaman(() => f, "degup-demo-", HAD);
    const h = p.mula(KINI);
    expect(h).toMatchObject({ ok: true, nama: "degup-demo-20261118-210509.webm" });
    expect(p.mula(KINI).ok).toBe(false); // satu rakaman pada satu masa
    expect(p.tulis(new Uint8Array([1, 2, 3]))).toBe(true);
    expect(p.tulis(new Uint8Array([4, 5]))).toBe(true);
    const t = p.tamat();
    expect(t.ok).toBe(true);
    expect(readdirSync(f)).toEqual(["degup-demo-20261118-210509.webm"]);
    expect([...readFileSync(join(f, "degup-demo-20261118-210509.webm"))]).toEqual([1, 2, 3, 4, 5]);
    expect(p.mula(KINI)).toMatchObject({ ok: true, nama: "degup-demo-20261118-210509-2.webm" });
  });

  it("menolak bukan-bait, ketul terlalu besar, melepasi jumlah, dan tulis tanpa rakaman", () => {
    const f = baharu();
    const p = new PenulisRakaman(() => f, "d-", HAD);
    expect(p.tulis(new Uint8Array([1]))).toBe(false);
    p.mula(KINI);
    expect(p.tulis("teks")).toBe(false);
    expect(p.tulis(new Uint8Array(9))).toBe(false);
    expect(p.tulis(new Uint8Array(8))).toBe(true);
    expect(p.tulis(new Uint8Array(5))).toBe(false);
  });

  it("rakaman kosong tidak meninggalkan fail", () => {
    const f = baharu();
    const p = new PenulisRakaman(() => f, "d-", HAD);
    p.mula(KINI);
    expect(p.tamat().ok).toBe(false);
    expect(readdirSync(f)).toEqual([]);
  });
});

describe("perakam fixture (§4.10)", () => {
  const sesi = () => {
    const t0 = 1_763_470_000_000_000;
    const kumpul = new PengumpulFixture();
    for (const m of new PenjanaSim(app.sim, t0).jana(20)) kumpul.tambahMetrik(m);
    kumpul.tambahKetukan(t0 + 12e6);
    const f = kumpul.keFixture({ skema: app.replay.skema, jenis: "ujian", label: "sesi 2026-11-18", tarikh: "2026-11-18" });
    const babak = babakRelatif({ lihat: [t0, t0 + 10e6], rasa: [t0 + 10e6, t0 + 20e6], lentur: [t0 + 20e6, t0 + 20e6] }, masaMula(f));
    if (babak) f.meta.babak = babak;
    return f;
  };

  it("babakRelatif: saat relatif sampel pertama; julat kosong dibuang", () => {
    expect(babakRelatif({ lihat: [2e6, 5e6], lentur: [9e6, 9e6] }, 1e6)).toEqual({ lihat: [1, 4] });
    expect(babakRelatif({}, 0)).toBeNull();
  });

  it("menulis skema P2b yang lulus pengesah; angka sahaja; nama dari main", () => {
    const f = sesi();
    const h = simpanFixtureRakaman(baharu(), "degup-fixture-", f, app.replay.skema, KINI);
    expect(h).toMatchObject({ ok: true, nama: "degup-fixture-20261118-210509.json" });
    const dibaca = JSON.parse(readFileSync(join(folder, "degup-fixture-20261118-210509.json"), "utf8"));
    expect(sahkanFixture(dibaca, app.replay.skema).ok).toBe(true);
    expect(dibaca.meta.babak).toEqual({ lihat: [0, 10], rasa: [10, 20] });
    // Tiada rentetan dalam data selain meta (tiada imej/base64/laluan): setiap daun = nombor atau boolean.
    const { meta: _m, ...data } = dibaca;
    const daun = (x: unknown): unknown[] => (typeof x === "object" && x !== null ? Object.values(x).flatMap(daun) : [x]);
    expect(daun(data).every((v) => typeof v === "number" || typeof v === "boolean")).toBe(true);
  });

  it("menolak data yang ada imej/kunci asing (tiada fail ditulis)", () => {
    const f = { ...sesi(), gambar: "data:image/png;base64,AAAA" };
    expect(simpanFixtureRakaman(baharu(), "x-", f, app.replay.skema, KINI).ok).toBe(false);
    expect(readdirSync(folder)).toEqual([]);
  });
});

describe("penyediaan SDK main (§4.11)", () => {
  it("laluanCapi: pakej platform dalam app.asar.unpacked", () => {
    expect(laluanCapi("/r", "@smartspectra/node-sdk", "win32", "x64")).toBe(
      join("/r", "app.asar.unpacked", "node_modules", "@smartspectra/node-sdk-win32-x64", "smartspectra_capi.dll"),
    );
    expect(laluanCapi("/r", "p", "aix", "x64")).toBeNull();
  });

  it("sediaPersekitaran: CAPI hanya bila dipakej dan wujud; lavapipe Linux; nilai pengguna tidak ditindih", () => {
    const k = { dipakej: true, resources: "/r", pakej: app.sdk.pakej, platform: "linux", arch: "x64", vulkanIcdLinux: app.sdk.vulkan_icd_linux, wujud: () => true };
    const env: Record<string, string | undefined> = {};
    expect(sediaPersekitaran(env, k).sort()).toEqual(["SMARTSPECTRA_CAPI_PATH", "VK_ICD_FILENAMES"]);
    expect(env.VK_ICD_FILENAMES).toBe(app.sdk.vulkan_icd_linux);
    const sendiri = { VK_ICD_FILENAMES: "/gpu.json" };
    expect(sediaPersekitaran(sendiri, { ...k, dipakej: false })).toEqual([]);
    expect(sendiri.VK_ICD_FILENAMES).toBe("/gpu.json");
    expect(sediaPersekitaran({}, { ...k, platform: "win32", dipakej: false })).toEqual([]);
  });

  it("PengikatSdk: tiada kunci = 'kunci' tanpa memuat SDK; ikat sekali setiap tetingkap; muat gagal = 'sdk'", () => {
    let dimuat = 0;
    const diikat: object[] = [];
    let kunci: string | null = null;
    const p = new PengikatSdk<object>(
      () => {
        dimuat++;
        return { bindSmartSpectraIpc: (w) => void diikat.push(w) };
      },
      () => kunci,
      () => {},
    );
    const win = {};
    expect(p.sedia(win)).toEqual({ ok: false, sebab: "kunci" });
    expect(dimuat).toBe(0);
    kunci = "k";
    expect(p.sedia(win)).toEqual({ ok: true, kunci: "k" });
    expect(p.sedia(win)).toEqual({ ok: true, kunci: "k" });
    expect(diikat).toEqual([win]);
    const gagal = new PengikatSdk<object>(() => { throw new Error("tiada pustaka"); }, () => "k", () => {});
    expect(gagal.sedia({})).toMatchObject({ ok: false, sebab: "sdk" });
  });
});
