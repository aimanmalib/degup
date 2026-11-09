// P3b (PRD §4.1, §4.2, §4.4): LIHAT → RASA → pendedahan dalam `sim`, ketukan diskrip sefasa → Selaras, tersebar → Meneka;
// jeda petunjuk SDK (LIHAT + RASA) dan ulang pusingan. Skala masa ujian (DEGUP_SKALA_MASA, sim sahaja) memendekkan babak.
import { expect, test, type Page } from "@playwright/test";
import { bacaKonfig, bacaLang, bukti, lancar, type Lancar } from "./bantu.js";

const app = bacaKonfig();
const ms = bacaLang("ms");
const en = bacaLang("en");

interface Uji {
  petunjuk(kod: number): void;
  ketukSefasa(sesaranMs: number): number;
  ketukTersebar(): number;
}
const cangkuk = (win: Page) => ({
  petunjuk: (kod: number) => win.evaluate((k) => (globalThis as unknown as { degupUji: Uji }).degupUji.petunjuk(k), kod),
  sefasa: (ms_: number) => win.evaluate((m) => (globalThis as unknown as { degupUji: Uji }).degupUji.ketukSefasa(m), ms_),
  tersebar: () => win.evaluate(() => (globalThis as unknown as { degupUji: Uji }).degupUji.ketukTersebar()),
});

let l: Lancar;
test.afterEach(async () => {
  await l?.tutup();
});

async function keLihat(win: Page): Promise<void> {
  await win.locator("[data-uji=umur]").check();
  await win.locator("[data-uji=hidupkan]").click();
  await expect(win.locator("[data-uji=lihat]")).toBeVisible();
}

test("aliran: LIHAT berdenyut + Sedia → RASA sefasa → Selaras; Cuba lagi → tersebar → Meneka", async () => {
  const skala = 0.5;
  test.setTimeout(150_000);
  l = await lancar("sim", { DEGUP_SKALA_MASA: String(skala) });
  const { win } = l;
  const c = cangkuk(win);
  await keLihat(win);

  // LIHAT: BPM muncul bila stabil; Sedia tertutup sehingga stabil ≥ N s (berskala).
  const sedia = win.locator("[data-uji=sedia]");
  await expect(sedia).toBeDisabled();
  await expect(win.locator("[data-uji=lihat]")).toHaveAttribute("data-keadaan", "hidup", { timeout: 10_000 });
  await expect(win.locator("[data-uji=bpm]")).toHaveText(/^\d{2,3}$/);
  await expect(win.getByText(ms.lihat.arahan)).toBeVisible();
  await bukti(win, "lihat-ms", "p3b");
  await expect(sedia).toBeEnabled({ timeout: (app.aliran.lihat_sedia_selepas_stabil_s * skala + 5) * 1000 });
  await sedia.click();

  // RASA: arahan, tiada BPM / pelita hidup; Space dikira sebagai ketukan.
  const rasa = win.locator("[data-uji=rasa]");
  await expect(rasa).toBeVisible();
  await expect(win.getByText(ms.rasa.arahan)).toBeVisible();
  await expect(win.locator("[data-uji=bpm]")).toHaveCount(0);
  await bukti(win, "rasa-ms", "p3b");
  await win.keyboard.press("Space");
  const rasaMs = app.aliran.rasa_s * skala * 1000;
  await win.waitForTimeout(rasaMs - 2500);
  const nSefasa = await c.sefasa(150);
  expect(nSefasa).toBeGreaterThanOrEqual(app.rasa.n_min);

  const dedah = win.locator("[data-uji=dedah]");
  await expect(dedah).toBeVisible({ timeout: 10_000 });
  await expect(win.locator("[data-uji=jalur]")).toHaveAttribute("data-jalur", "selaras");
  await expect(win.locator("[data-uji=jalur]")).toHaveText(ms.rasa.jalur.selaras);
  await expect(win.locator("[data-uji=kiraan]")).toHaveAttribute("data-n", String(nSefasa + 1));
  await expect(win.getByText(ms.umum.penafian)).toBeVisible();
  await expect(win.getByText(ms.dedah.bukan_kebetulan)).toBeVisible();
  expect(await win.locator(".tanda-degup").count()).toBeGreaterThanOrEqual(nSefasa);
  await expect(win.locator(".titik-ketuk")).toHaveCount(nSefasa + 1);
  expect(await win.locator("html").evaluate((el) => el.scrollWidth - el.clientWidth)).toBeLessThanOrEqual(0);
  await win.waitForTimeout(app.dedah.kiraan_ms + 1500);
  await bukti(win, "dedah-selaras-ms", "p3b");
  // Tukar bahasa di pendedahan: keadaan kekal, teks bertukar.
  await win.getByRole("button", { name: en.bahasa.en_penuh }).click();
  await expect(win.locator("[data-uji=jalur]")).toHaveText(en.rasa.jalur.selaras);
  await bukti(win, "dedah-selaras-en", "p3b");
  await win.getByRole("button", { name: ms.bahasa.ms_penuh }).click();

  await win.locator("[data-uji=cuba-lagi]").click();
  await expect(rasa).toBeVisible();
  await win.waitForTimeout(rasaMs - 2500);
  expect(await c.tersebar()).toBeGreaterThanOrEqual(app.rasa.n_min);
  await expect(dedah).toBeVisible({ timeout: 10_000 });
  await expect(win.locator("[data-uji=jalur]")).toHaveAttribute("data-jalur", "meneka");
  await expect(win.getByText(ms.dedah.kebetulan)).toBeVisible();
  await win.waitForTimeout(app.dedah.kiraan_ms + 1500);
  await bukti(win, "dedah-meneka-ms", "p3b");
  // Saiz minimum tetingkap: tiada limpahan mendatar; butang masih boleh dicapai.
  await l.app.evaluate(({ BrowserWindow }, s) => BrowserWindow.getAllWindows()[0]?.setContentSize(s.min_lebar, s.min_tinggi), app.tetingkap);
  await expect.poll(() => win.locator("html").evaluate((el) => el.clientWidth)).toBe(app.tetingkap.min_lebar);
  expect(await dedah.evaluate((el) => el.scrollWidth - el.clientWidth)).toBeLessThanOrEqual(0);
  await win.locator("[data-uji=teruskan]").scrollIntoViewIfNeeded();
  await bukti(win, "dedah-meneka-1024", "p3b");

  // Teruskan → LENTUR (P3c); Esc menamatkan sesi dan kembali ke izin.
  await win.locator("[data-uji=teruskan]").click();
  await expect(win.locator("[data-uji=lentur]")).toBeVisible();
  await win.keyboard.press("Escape");
  await expect(win.locator("[data-uji=senarai-izin]")).toBeVisible();
});

test("jeda petunjuk: LIHAT dijeda + Sedia ditutup; RASA dijeda > had → pusingan diulang; tiada ketukan → tak cukup data", async () => {
  const skala = 0.25;
  test.setTimeout(90_000);
  l = await lancar("sim", { DEGUP_SKALA_MASA: String(skala) });
  const { win } = l;
  const c = cangkuk(win);
  await keLihat(win);
  const lihat = win.locator("[data-uji=lihat]");
  const petunjuk = win.locator("[data-uji=petunjuk]");
  await expect(lihat).toHaveAttribute("data-keadaan", "hidup", { timeout: 10_000 });

  await c.petunjuk(1);
  await expect(petunjuk).toBeVisible();
  await expect(petunjuk).toContainText(ms.petunjuk.tiada_muka);
  await expect(lihat).toHaveAttribute("data-keadaan", "dijeda");
  await expect(win.locator("[data-uji=sedia]")).toBeDisabled();
  await bukti(win, "lihat-jeda-ms", "p3b");
  await c.petunjuk(0);
  await expect(petunjuk).toBeHidden();
  await expect(win.locator("[data-uji=sedia]")).toBeEnabled({ timeout: (app.aliran.lihat_sedia_selepas_stabil_s * skala + 5) * 1000 });
  await win.locator("[data-uji=sedia]").click();

  await expect(win.locator("[data-uji=rasa]")).toBeVisible();
  await c.petunjuk(12);
  await expect(petunjuk).toContainText(ms.petunjuk.gerak);
  await expect(win.locator("[data-uji=rasa]")).toHaveAttribute("data-keadaan", "dijeda");
  // Ketukan semasa jeda tidak dikira.
  await win.keyboard.press("Space");
  await expect(win.locator("[data-uji=rasa-ulang]")).toBeVisible({ timeout: (app.aliran.jeda_ulang_pusingan_s * skala + 3) * 1000 });
  await c.petunjuk(0);
  await expect(petunjuk).toBeHidden();
  await expect(win.locator("[data-uji=dedah]")).toBeVisible({ timeout: (app.aliran.rasa_s * skala + 8) * 1000 });
  await expect(win.locator("[data-uji=dedah]")).toHaveAttribute("data-cukup", "false");
  await expect(win.getByText(ms.rasa.tak_cukup)).toBeVisible();
  await expect(win.locator("[data-uji=kiraan]")).toHaveAttribute("data-n", "0");

  await win.keyboard.press("Escape");
  await expect(win.locator("[data-uji=senarai-izin]")).toBeVisible();
});
