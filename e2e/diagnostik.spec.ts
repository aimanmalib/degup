// PH§5.6 L1: diagnostik sentuhan pertama dalam app sebenar (Electron), kegagalan disuntik tanpa kod ujian dalam app:
// (1) pustaka asli SDK tidak ditemui (`SMARTSPECTRA_CAPI_PATH` menunjuk fail tiada di bawah folder rumah) → ayat SDK + baris
// Butiran dengan `~`, log `sdk_sedia` membawa ralat; (2) tiada peranti kamera (tanpa kamera tiruan) → ayat kamera ikut nama ralat +
// Butiran, log `kamera_gagal`. Kunci ujian palsu; SDK tidak pernah dimula, tiada kredit dipakai.
import { expect, test } from "@playwright/test";
import { readdirSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { bacaKonfig, bacaLang, bukti, lancar, type Lancar } from "./bantu.js";

const ms = bacaLang("ms");
const en = bacaLang("en");
const konfig = bacaKonfig();
const KUNCI = "uji-kunci-bukan-sebenar-L1-123";

let l: Lancar | null = null;
test.afterEach(async () => {
  await l?.tutup();
  l = null;
});

const barisLog = (data: string): Array<Record<string, unknown>> => {
  const f = join(data, konfig.log.folder);
  return readdirSync(f)
    .filter((x) => x.startsWith(konfig.log.awalan_fail))
    .flatMap((x) => readFileSync(join(f, x), "utf8").trim().split("\n"))
    .map((b) => JSON.parse(b));
};

async function simpanKunci(l: Lancar): Promise<void> {
  const { win } = l;
  await win.locator("[data-uji=buka-tetapan]").click();
  const panel = win.locator("[data-uji=panel-tetapan]");
  await panel.locator("[data-uji=medan-kunci]").fill(KUNCI);
  await panel.locator("[data-uji=simpan-kunci]").click();
  await expect(panel.locator("[data-uji=kunci-ada]")).toBeVisible();
  await win.keyboard.press("Escape");
  await expect(panel).toBeHidden();
}

const tiadaLimpah = async (l: Lancar) =>
  expect(await l.win.locator("html").evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);

test("SDK gagal dimuat: ayat SDK + Butiran (laluan rumah = ~), log sdk_sedia + mula_gagal membawa mesej, tiada kunci", async () => {
  const capi = join(homedir(), "degup-l1-tiada", "libsmartspectra_capi.so");
  l = await lancar("live", { SMARTSPECTRA_CAPI_PATH: capi }, ["--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream"]);
  const { win } = l;
  await simpanKunci(l);
  await win.locator("[data-uji=umur]").check();
  await win.locator("[data-uji=hidupkan]").click();
  await expect(win.locator("[data-uji=ralat-mula]")).toHaveText(ms.live.ralat_sdk);
  const butiran = win.locator("[data-uji=ralat-butiran]");
  await expect(butiran).toContainText(ms.umum.butiran.replace("{x}", ""));
  await expect(butiran).toContainText("SMARTSPECTRA_CAPI_PATH=~/degup-l1-tiada/");
  const teks = (await butiran.textContent()) ?? "";
  expect(teks.length - ms.umum.butiran.replace("{x}", "").length).toBeLessThanOrEqual(konfig.log.butiran_maks);
  expect(teks).not.toContain(homedir());
  await expect(win.locator("[data-uji=kamera-hidup]")).toHaveCount(0);
  await tiadaLimpah(l);
  await bukti(win, "sdk-gagal-ms", "l1");
  await win.locator(".suis-bahasa button[lang=en]").click();
  await expect(win.locator("[data-uji=ralat-mula]")).toHaveText(en.live.ralat_sdk);
  await expect(butiran).toContainText(en.umum.butiran.replace("{x}", ""));
  await bukti(win, "sdk-gagal-en", "l1");

  const log = barisLog(l.data);
  const mentah = JSON.stringify(log);
  expect(log[0]).toMatchObject({ jenis: "app", sdk: konfig.sdk.versi, izin_kamera: process.platform === "linux" ? "n/a" : expect.any(String) });
  expect(log).toContainEqual(expect.objectContaining({ jenis: "sdk_sedia", ok: false, sebab: "sdk", ralat: expect.stringContaining("~/degup-l1-tiada/") }));
  expect(log).toContainEqual(expect.objectContaining({ jenis: "mula_gagal", sebab: "sdk", mesej: expect.stringContaining("SMARTSPECTRA_CAPI_PATH") }));
  expect(mentah).not.toContain(homedir());
  expect(mentah).not.toContain(KUNCI);
});

test("tiada peranti kamera: ayat kamera ikut nama ralat + Butiran, log kamera_gagal", async () => {
  // Tanpa --use-fake-device-for-media-stream: hos ujian/CI tiada kamera, jadi getUserMedia gagal dengan ralat sebenar Chromium.
  l = await lancar("live", {}, ["--use-fake-ui-for-media-stream"]);
  const { win } = l;
  await simpanKunci(l);
  await win.locator("[data-uji=umur]").check();
  await win.locator("[data-uji=hidupkan]").click();
  const ralat = win.locator("[data-uji=ralat-mula]");
  await expect(ralat).toBeVisible();
  const log = barisLog(l.data);
  const gagal = log.find((b) => b.jenis === "kamera_gagal") as { nama: string; mesej: string } | undefined;
  expect(gagal, JSON.stringify(log)).toBeTruthy();
  const kunci = (konfig.kamera_ralat[gagal!.nama] as string | undefined) ?? "kamera.ralat";
  const [kump, k] = kunci.split(".");
  await expect(ralat).toHaveText(ms[kump!][k!]);
  await expect(win.locator("[data-uji=ralat-butiran]")).toContainText(gagal!.nama);
  await expect(win.locator("[data-uji=kamera-hidup]")).toHaveCount(0);
  await tiadaLimpah(l);
  await bukti(win, "kamera-gagal-ms", "l1");
  await win.locator(".suis-bahasa button[lang=en]").click();
  await expect(ralat).toHaveText(en[kump!][k!]);
  await bukti(win, "kamera-gagal-en", "l1");
});
