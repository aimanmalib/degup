// P3c, H3 (PRD §2, §4.2): aliran penuh izin → LIHAT → RASA → pendedahan → LENTUR → keputusan dalam `sim` DAN `replay`;
// kad PNG disimpan tempatan (tandatangan + saiz kanvas dari config), "Main lagi" kembali ke LIHAT.
import { expect, test, type Page } from "@playwright/test";
import { copyFileSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { bacaKonfig, bacaLang, bukti, lancar, type Lancar } from "./bantu.js";

const app = bacaKonfig();
const ms = bacaLang("ms");
const en = bacaLang("en");
const SKALA = 0.5;

let l: Lancar;
test.afterEach(async () => {
  await l?.tutup();
});

async function keRasa(win: Page): Promise<void> {
  await win.locator("[data-uji=umur]").check();
  await win.locator("[data-uji=hidupkan]").click();
  await expect(win.locator("[data-uji=lihat]")).toHaveAttribute("data-keadaan", "hidup", { timeout: 15_000 });
  await win.locator("[data-uji=sedia]").click({ timeout: (app.aliran.lihat_sedia_selepas_stabil_s * SKALA + 10) * 1000 });
  await expect(win.locator("[data-uji=rasa]")).toBeVisible();
}

/** LENTUR penuh: panduan nafas, jalur IBI hidup, hujung dengan ringkasan ms. Pulang nilai ms (atau "" bila tak cukup). */
async function lentur(win: Page, nama: string): Promise<string> {
  const babak = win.locator("[data-uji=lentur]");
  await expect(babak).toBeVisible();
  await expect(babak).toHaveAttribute("data-keadaan", "bernafas");
  await expect(win.locator("[data-uji=fasa]")).toHaveText(new RegExp(`^(${ms.lentur.tarik}|${ms.lentur.hembus})$`));
  await expect(win.getByText(ms.lentur.arahan)).toBeVisible();
  await expect.poll(async () => Number(await win.locator("[data-uji=sela]").getAttribute("data-n")), { timeout: 15_000 }).toBeGreaterThan(3);
  await expect(win.locator("[data-uji=sela]")).toHaveText(/\d+ → \d+ ms$/);
  expect(await win.locator(".jalur-ibi .ibi-titik").count()).toBeGreaterThan(3);
  expect(await win.locator(".jalur-ibi .lorek-tarik").count()).toBeGreaterThan(0);
  await bukti(win, `lentur-${nama}`, "p3c");
  const hujung = win.locator("[data-uji=lentur-hujung]");
  await expect(hujung).toBeVisible({ timeout: (app.aliran.lentur_s * SKALA + 10) * 1000 });
  await expect(win.getByText(ms.lentur.penerangan)).toBeVisible();
  await expect(win.getByText(ms.umum.penafian)).toBeVisible();
  await bukti(win, `lentur-hujung-${nama}`, "p3c");
  return (await hujung.getAttribute("data-ms")) ?? "";
}

/** Simpan kad: fail PNG dalam folder data ujian (gambar/<folder>), lebar × tinggi IHDR = config.kad. */
async function simpanKad(win: Page, data: string, nama: string): Promise<void> {
  const status = win.locator("[data-uji=status-kad]");
  const sebelum = await status.getAttribute("data-nama");
  await win.locator("[data-uji=simpan-kad]").click();
  await expect(status).toHaveAttribute("data-nama", /^degup-kad-\d{8}-\d{6}(-\d+)?\.png$/, { timeout: 10_000 });
  await expect(status).not.toHaveAttribute("data-nama", sebelum ?? "");
  const fail = join(data, "gambar", app.kad.folder, (await status.getAttribute("data-nama"))!);
  const b = readFileSync(fail);
  expect([...b.subarray(0, 8)]).toEqual([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  expect([b.readUInt32BE(16), b.readUInt32BE(20)]).toEqual([app.kad.lebar, app.kad.tinggi]);
  if (process.env.AUTOPILOT_BUKTI_DIR) copyFileSync(fail, join(process.env.AUTOPILOT_BUKTI_DIR, `degup-p3c-kad-${nama}.png`));
}

async function tiadaLimpah(win: Page, sel: string): Promise<void> {
  expect(await win.locator(sel).evaluate((el) => el.scrollWidth - el.clientWidth)).toBeLessThanOrEqual(0);
  expect(await win.locator("html").evaluate((el) => el.scrollWidth - el.clientWidth)).toBeLessThanOrEqual(0);
}

test("sim: aliran penuh, skor RASA dibawa ke kad, LENTUR ms, kad PNG, Main lagi", async () => {
  test.setTimeout(180_000);
  l = await lancar("sim", { DEGUP_SKALA_MASA: String(SKALA) });
  const { win } = l;
  await keRasa(win);
  await win.waitForTimeout(app.aliran.rasa_s * SKALA * 1000 - 2500);
  await win.evaluate(() => (globalThis as unknown as { degupUji: { ketukSefasa(m: number): number } }).degupUji.ketukSefasa(150));
  await expect(win.locator("[data-uji=jalur]")).toHaveAttribute("data-jalur", "selaras", { timeout: 10_000 });
  await win.waitForTimeout(app.dedah.kiraan_ms + 300);
  const skor = (await win.locator("[data-uji=skor]").textContent())!;
  await win.locator("[data-uji=teruskan]").click();

  const msLentur = await lentur(win, "sim-ms");
  expect(Number(msLentur)).toBeGreaterThan(0);
  await expect(win.locator("[data-uji=lentur-prq]")).toBeVisible();
  await tiadaLimpah(win, "[data-uji=lentur]");
  await win.locator("[data-uji=ke-keputusan]").click();

  // Keputusan: kamera/sesi ditutup; kad membawa skor, jalur, ms dan nadi.
  await expect(win.locator("[data-uji=keputusan]")).toBeVisible();
  await expect(win.locator("[data-uji=kamera-hidup]")).toHaveCount(0);
  await expect(win.locator("[data-uji=kad-skor]")).toHaveText(skor);
  await expect(win.locator("[data-uji=kad-jalur]")).toHaveAttribute("data-jalur", "selaras");
  await expect(win.locator("[data-uji=kad-lambat] dd")).toHaveText(`${msLentur} ms`);
  await expect(win.locator("[data-uji=kad-nadi] dd")).toHaveText(/^\d{2,3} /);
  await expect(win.locator("[data-uji=kad-tarikh]")).toHaveText(/^\d{4}-\d{2}-\d{2}$/);
  await bukti(win, "keputusan-sim-ms", "p3c");
  await simpanKad(win, l.data, "sim-ms");
  await expect(win.locator("[data-uji=status-kad]")).toContainText(ms.keputusan.buka_folder);
  await win.getByRole("button", { name: en.bahasa.en_penuh }).click();
  await expect(win.locator("[data-uji=simpan-kad]")).toHaveText(en.keputusan.simpan);
  await expect(win.locator("[data-uji=status-kad]")).toHaveAttribute("data-nama", /\.png$/); // keadaan kekal selepas tukar bahasa
  await bukti(win, "keputusan-sim-en", "p3c");
  await simpanKad(win, l.data, "sim-en");
  await l.app.evaluate(({ BrowserWindow }, s) => BrowserWindow.getAllWindows()[0]?.setContentSize(s.min_lebar, s.min_tinggi), app.tetingkap);
  await expect.poll(() => win.locator("html").evaluate((el) => el.clientWidth)).toBe(app.tetingkap.min_lebar);
  await tiadaLimpah(win, "[data-uji=keputusan]");
  await bukti(win, "keputusan-sim-1024", "p3c");

  await win.locator("[data-uji=main-lagi]").click();
  await expect(win.locator("[data-uji=lihat]")).toBeVisible();
});

test("replay: aliran penuh atas fixture contoh, tanpa ketukan cukup → kad tanpa skor", async () => {
  test.setTimeout(180_000);
  l = await lancar("replay", { DEGUP_SKALA_MASA: String(SKALA) });
  const { win } = l;
  await expect(win.locator("[data-uji=lencana-sumber]")).toBeVisible();
  await keRasa(win);
  for (let i = 0; i < 3; i++) {
    await win.keyboard.press("Space");
    await win.waitForTimeout(600);
  }
  await expect(win.locator("[data-uji=dedah]")).toHaveAttribute("data-cukup", "false", { timeout: (app.aliran.rasa_s * SKALA + 10) * 1000 });
  await win.locator("[data-uji=teruskan]").click();

  const msLentur = await lentur(win, "replay-ms");
  await win.locator("[data-uji=ke-keputusan]").click();
  await expect(win.locator("[data-uji=keputusan]")).toBeVisible();
  await expect(win.locator("[data-uji=kad-skor]")).toHaveText("—");
  await expect(win.locator("[data-uji=kad-kiraan] dd")).toContainText("3");
  if (msLentur) await expect(win.locator("[data-uji=kad-lambat] dd")).toHaveText(`${msLentur} ms`);
  await bukti(win, "keputusan-replay-ms", "p3c");
  await simpanKad(win, l.data, "replay-ms");
  await win.keyboard.press("Escape");
  await expect(win.locator("[data-uji=senarai-izin]")).toBeVisible();
});
