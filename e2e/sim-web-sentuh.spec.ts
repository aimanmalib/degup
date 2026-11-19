// K5 (PH§5.5): halaman Simulation pelayar `docs/sim/` pada skrin sentuh (WebKit, peranti iPhone 13 dan lebar 320 px).
// Tiada papan kekunci = tiada Space/Esc: RASA meminta ketukan pada pelita, nota Esc menjadi butang Henti yang benar-benar
// menghentikan pusingan. BM + EN dari locale pelayar. Tiada limpahan mendatar, tiada ralat konsol.
import { devices, expect, test, webkit, type Browser, type Page } from "@playwright/test";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { bacaKonfig, bacaLang, bukti } from "./bantu.js";
import { pelayanStatik } from "./pelayan-statik.js";

const app = bacaKonfig();
const SKALA = 0.25;
const AKAR = fileURLToPath(new URL(`../${app.sim_web.folder}/`, import.meta.url));
const ADA_WEBKIT = existsSync(webkit.executablePath());

const PERANTI = [
  { nama: "iphone13", guna: devices["iPhone 13"] },
  { nama: "320", guna: { ...devices["iPhone 13"], viewport: { width: 320, height: 640 } } },
];
const BAHASA = [
  { b: "en" as const, locale: "en-US" },
  { b: "ms" as const, locale: "ms-MY" },
];

let pelayar: Browser | undefined;
let tutupPelayan: (() => Promise<void>) | undefined;
test.afterEach(async () => {
  await pelayar?.close();
  await tutupPelayan?.();
});

async function tiadaLimpahan(win: Page): Promise<void> {
  expect(await win.locator("html").evaluate((el) => el.scrollWidth - el.clientWidth)).toBeLessThanOrEqual(0);
}

test("sim web sentuh: ayat ketuk + butang Henti ganti Space/Esc, BM + EN, iPhone 13 + 320 px", async () => {
  test.skip(!ADA_WEBKIT, "WebKit Playwright tiada di mesin ini (hos: ujian-pelayar.sh)");
  test.setTimeout(240_000);
  const p = await pelayanStatik(AKAR);
  tutupPelayan = p.tutup;
  pelayar = await webkit.launch();
  for (const { nama, guna } of PERANTI) {
    for (const { b, locale } of BAHASA) {
      const lang = bacaLang(b);
      const ctx = await pelayar.newContext({ ...guna, locale });
      const win = await ctx.newPage();
      const ralat: string[] = [];
      win.on("pageerror", (x) => ralat.push(String(x)));
      win.on("console", (m) => m.type() === "error" && ralat.push(m.text()));
      // Tangkapan skrin Playwright menyuntik helaian gaya yang CSP halaman tolak (WebKit, diukur J8): hanya ralat itu, hanya
      // semasa tangkapan, diabaikan; ralat lain kekal.
      const tangkap = async (n: string): Promise<void> => {
        const sebelum = ralat.length;
        await bukti(win, n, "k5");
        const baru = ralat.splice(sebelum).filter((x) => !/^Refused to apply a stylesheet .*Content Security Policy/.test(x));
        ralat.push(...baru);
      };
      await win.goto(`${p.url}?${app.sim_web.param_skala}=${SKALA}`);
      await win.waitForSelector("[data-uji=senarai-izin]");
      expect(await win.evaluate((m: string) => (globalThis as unknown as { matchMedia(q: string): { matches: boolean } }).matchMedia(m).matches, app.sentuh.media)).toBe(true);
      await expect(win.locator("html")).toHaveAttribute("lang", b);
      await win.locator("[data-uji=umur]").check();
      await win.locator("[data-uji=hidupkan]").tap();

      // LIHAT: nota Esc diganti ayat sentuh + butang Henti.
      await expect(win.locator("[data-uji=lihat]")).toHaveAttribute("data-keadaan", "hidup", { timeout: 15_000 });
      await expect(win.locator("[data-uji=nota-henti]")).toContainText(lang.lihat.henti_sentuh);
      await expect(win.locator("[data-uji=henti-sentuh]")).toHaveText(lang.lihat.henti);
      await expect(win.getByText(lang.lihat.esc)).toHaveCount(0);
      await tiadaLimpahan(win);
      await tangkap(`lihat-${b}-${nama}`);
      await win.locator("[data-uji=sedia]").tap({ timeout: (app.aliran.lihat_sedia_selepas_stabil_s * SKALA + 10) * 1000 });

      // RASA: ayat ketuk pelita; ketukan sentuh diterima; butang Henti tidak dikira sebagai ketukan dan menghentikan pusingan.
      await expect(win.locator("[data-uji=rasa]")).toBeVisible();
      await expect(win.locator(".rasa-arahan")).toHaveText(lang.rasa.arahan_sentuh);
      await expect(win.getByText(lang.rasa.arahan)).toHaveCount(0);
      await expect(win.locator("[data-uji=henti-sentuh]")).toBeVisible();
      await win.locator("[data-uji=rasa] .pelita").first().tap();
      await tiadaLimpahan(win);
      await tangkap(`rasa-${b}-${nama}`);
      await win.locator("[data-uji=henti-sentuh]").tap();
      await expect(win.locator("[data-uji=rasa]")).toHaveCount(0);
      await expect(win.locator("[data-uji=senarai-izin]")).toBeVisible();
      await tiadaLimpahan(win);

      expect(ralat).toEqual([]);
      await ctx.close();
    }
  }
});
