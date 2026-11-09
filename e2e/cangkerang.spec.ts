// P3a (PRD §4.6, §4.7): izin → tetapan → Data, tukar bahasa, kunci safeStorage, padam semua, kamera/Esc dalam sim.
import { expect, test } from "@playwright/test";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { bacaLang, bukti, lancar, type Lancar } from "./bantu.js";

const ms = bacaLang("ms");
const en = bacaLang("en");

let l: Lancar;
test.beforeEach(async () => {
  l = await lancar("sim");
});
test.afterEach(async () => {
  await l.tutup();
});

test("izin: tujuh perkara, kotak 18+ membuka butang, tukar bahasa", async () => {
  const { win } = l;
  await expect(win.locator("h1")).toHaveText(ms.izin.tajuk);
  await expect(win.locator("[data-uji=senarai-izin] > li")).toHaveCount(7);
  await expect(win.getByText(ms.izin.perkara["6"].teks)).toBeVisible();
  const hidupkan = win.locator("[data-uji=hidupkan]");
  await expect(hidupkan).toBeDisabled();
  await win.locator("[data-uji=umur]").check();
  await expect(hidupkan).toBeEnabled();
  await expect(win.locator("[data-uji=lencana-sumber]")).toHaveText(ms.umum.simulasi);
  await bukti(win, "izin-ms");

  await win.getByRole("button", { name: en.bahasa.en_penuh }).click();
  await expect(win.locator("h1")).toHaveText(en.izin.tajuk);
  await expect(win.locator("html")).toHaveAttribute("lang", "en");
  await bukti(win, "izin-en");
  // Bahasa kekal selepas buka semula (tetapan.json).
  expect(JSON.parse(readFileSync(join(l.data, "tetapan.json"), "utf8")).bahasa).toBe("en");
});

test("tetapan: kunci disimpan terenkripsi, tidak dipapar semula; Data mengira fail; padam semua", async () => {
  const { win } = l;
  await win.locator("[data-uji=buka-tetapan]").click();
  const panel = win.locator("[data-uji=panel-tetapan]");
  await expect(panel).toBeVisible();
  await expect(panel.locator("[data-uji=sumber-env]")).toBeVisible();
  await bukti(win, "tetapan-ms");

  const kunci = "uji-kunci-bukan-sebenar-123";
  await panel.locator("[data-uji=medan-kunci]").fill(kunci);
  await panel.locator("[data-uji=simpan-kunci]").click();
  await expect(panel.locator("[data-uji=kunci-ada]")).toHaveText(ms.tetapan.kunci_ada);
  expect(await win.content()).not.toContain(kunci);
  const fail = join(l.data, "kunci.bin");
  expect(existsSync(fail)).toBe(true);
  expect(readFileSync(fail).includes(Buffer.from(kunci))).toBe(false);

  await panel.locator("[data-uji=bunyi]").uncheck();
  await panel.locator("[data-uji=bahasa-en]").check();
  await expect(panel.locator("h2")).toHaveText(en.tetapan.tajuk);
  await bukti(win, "tetapan-en");
  await win.keyboard.press("Escape");
  await expect(panel).toBeHidden();

  await win.locator("[data-uji=buka-data]").click();
  const data = win.locator("[data-uji=panel-data]");
  await expect(data.locator("[data-uji=data-telemetri] dd")).toHaveText(en.data.mati);
  await expect(data.locator("[data-uji=data-bingkai] dd")).toHaveText("0");
  await expect(data.locator("[data-uji=data-pengesahan] dd")).toHaveText(en.data.belum);
  await expect(data.locator("[data-uji=data-fail]")).toContainText("kunci.bin");
  await expect(data.locator("[data-uji=data-fail]")).toContainText("tetapan.json");
  await expect(data.locator("[data-uji=data-simulasi]")).toBeVisible();
  await bukti(win, "data-en");
  await win.keyboard.press("Escape");

  await win.locator("[data-uji=buka-tetapan]").click();
  const padam = win.locator("[data-uji=padam-semua]");
  await padam.click();
  await expect(padam).toHaveText(en.tetapan.padam_sahkan);
  await padam.click();
  await expect(win.locator("[data-uji=padam-status]")).toHaveText(en.tetapan.padam_siap.replace("{n}", "2"));
  expect(existsSync(fail)).toBe(false);
  expect(existsSync(join(l.data, "tetapan.json"))).toBe(false);
});

test("hidupkan dalam sim → LIHAT tanpa kamera; Esc kembali ke izin; Tidak sekarang", async () => {
  const { win } = l;
  await win.locator("[data-uji=umur]").check();
  await win.locator("[data-uji=hidupkan]").click();
  await expect(win.locator("[data-uji=lihat]")).toBeVisible();
  await expect(win.locator("[data-uji=pratonton-sim]")).toHaveText(ms.kamera.simulasi);
  await expect(win.locator("[data-uji=kamera-hidup]")).toHaveCount(0);
  await win.keyboard.press("Escape");
  await expect(win.locator("h1")).toHaveText(ms.izin.tajuk);

  await win.locator("[data-uji=tidak-sekarang]").click();
  await expect(win.locator("[data-uji=rehat]")).toBeVisible();
  await win.getByRole("button", { name: ms.rehat.semula }).click();
  await expect(win.locator("[data-uji=senarai-izin]")).toBeVisible();
});

test("papan kekunci sahaja: Tab sampai ke kotak umur dan butang utama", async () => {
  const { win } = l;
  const fokus = new Set<string>();
  for (let i = 0; i < 20; i++) {
    await win.keyboard.press("Tab");
    fokus.add((await win.locator(":focus").getAttribute("data-uji")) ?? "");
    if (fokus.has("umur")) break;
  }
  expect(fokus.has("umur")).toBe(true);
  await win.keyboard.press("Space");
  await win.keyboard.press("Tab");
  await expect(win.locator("[data-uji=hidupkan]")).toBeFocused();
});

test("saiz minimum 1024×640: tiada limpahan mendatar pada izin dan helaian Tetapan", async () => {
  const { app, win } = l;
  await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0]?.setContentSize(1024, 640));
  await expect.poll(() => win.viewportSize()?.width ?? win.locator("html").evaluate((el) => el.clientWidth)).toBe(1024);
  const limpah = () => win.locator("html").evaluate((el) => el.scrollWidth - el.clientWidth);
  expect(await limpah()).toBeLessThanOrEqual(0);
  await win.locator("[data-uji=buka-tetapan]").click();
  const badan = win.locator("[data-uji=panel-tetapan] .panel-badan");
  await expect(badan).toBeVisible();
  expect(await badan.evaluate((el) => el.scrollWidth - el.clientWidth)).toBeLessThanOrEqual(0);
  expect(await limpah()).toBeLessThanOrEqual(0);
});
