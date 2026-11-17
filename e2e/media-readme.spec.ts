// Media README (D15, KR4): tangkapan skrin app SEBENAR dalam mod `sim` (tiada kamera, tiada kunci) untuk README.
// Dilangkau dalam gerbang biasa; dijalankan tangan: DEGUP_MEDIA_README=1 npx playwright test e2e/media-readme.spec.ts
// Keluaran: docs/media/{consent,see,feel-reveal,bend,result}.png (EN, 1280×800) + bingkai GIF dalam test-results/media-readme-bingkai/
// (GIF: node scripts/media-readme.mjs gif test-results/media-readme-bingkai).
import { expect, test, type Page } from "@playwright/test";
import { copyFileSync, mkdirSync, rmSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { bacaKonfig, bacaLang, lancar, type Lancar } from "./bantu.js";

test.skip(!process.env.DEGUP_MEDIA_README, "media README: hanya bila DEGUP_MEDIA_README=1");

const app = bacaKonfig();
const en = bacaLang("en");
const SKALA = 0.5;
const MEDIA = fileURLToPath(new URL("../docs/media/", import.meta.url));
const BINGKAI = fileURLToPath(new URL("../test-results/media-readme-bingkai/", import.meta.url));
const SELANG_MS = 200; // 5 fps, sama dengan scripts/media-readme.mjs

let l: Lancar;
let n = 0;
test.afterEach(async () => {
  await l?.tutup();
});

async function gambar(win: Page, nama: string): Promise<void> {
  await win.waitForTimeout(450); // helaian selesai gelongsor (--tempoh-helaian)
  await win.screenshot({ path: join(MEDIA, `${nama}.png`) });
}

/** Bingkai GIF: `kali` tangkapan setiap SELANG_MS (gerakan sebenar) atau satu tangkapan diulang (`diam`). */
async function bingkai(win: Page, kali: number, diam = false): Promise<void> {
  let akhir = "";
  for (let i = 0; i < kali; i++) {
    const f = join(BINGKAI, `${String(++n).padStart(4, "0")}.png`);
    if (diam && akhir) copyFileSync(akhir, f);
    else {
      const mula = Date.now();
      await win.screenshot({ path: f });
      await win.waitForTimeout(Math.max(0, SELANG_MS - (Date.now() - mula)));
    }
    akhir = f;
  }
}

test("media README: izin → LIHAT → RASA pendedahan → LENTUR → keputusan (EN, sim)", async () => {
  test.setTimeout(240_000);
  rmSync(BINGKAI, { recursive: true, force: true });
  mkdirSync(BINGKAI, { recursive: true });
  mkdirSync(MEDIA, { recursive: true });
  l = await lancar("sim", { DEGUP_SKALA_MASA: String(SKALA) });
  const { win } = l;

  await win.getByRole("button", { name: en.bahasa.en_penuh }).click();
  await expect(win.locator("[data-uji=hidupkan]")).toHaveText(en.izin.hidupkan);
  await expect(win.locator("[data-uji=lencana-sumber]")).toHaveText(en.umum.simulasi);
  await gambar(win, "consent");
  await bingkai(win, 6, true);

  await win.locator("[data-uji=umur]").check();
  await win.locator("[data-uji=hidupkan]").click();
  await expect(win.locator("[data-uji=lihat]")).toHaveAttribute("data-keadaan", "hidup", { timeout: 15_000 });
  await bingkai(win, 12);
  await gambar(win, "see");
  await win.locator("[data-uji=sedia]").click({ timeout: (app.aliran.lihat_sedia_selepas_stabil_s * SKALA + 10) * 1000 });
  await expect(win.locator("[data-uji=rasa]")).toBeVisible();
  await win.waitForTimeout(app.aliran.rasa_s * SKALA * 1000 - 2500);
  await win.evaluate(() => (globalThis as unknown as { degupUji: { ketukSefasa(m: number): number } }).degupUji.ketukSefasa(150));
  await expect(win.locator("[data-uji=dedah]")).toBeVisible({ timeout: 10_000 });
  await bingkai(win, 12);
  await expect(win.locator("[data-uji=jalur]")).toHaveAttribute("data-jalur", "selaras");
  await gambar(win, "feel-reveal");
  await win.locator("[data-uji=teruskan]").click();

  await expect(win.locator("[data-uji=lentur]")).toHaveAttribute("data-keadaan", "bernafas");
  await expect.poll(async () => Number(await win.locator("[data-uji=sela]").getAttribute("data-n")), { timeout: 20_000 }).toBeGreaterThan(12);
  await bingkai(win, 18);
  await gambar(win, "bend");
  await expect(win.locator("[data-uji=lentur-hujung]")).toBeVisible({ timeout: (app.aliran.lentur_s * SKALA + 10) * 1000 });
  await win.locator("[data-uji=ke-keputusan]").click();
  await expect(win.locator("[data-uji=keputusan]")).toBeVisible();
  await gambar(win, "result");
  await bingkai(win, 8, true);
});
