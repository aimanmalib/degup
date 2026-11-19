// K2 (PH§5.5): kod pengesahan berkelip semasa LIHAT (seperti kamera sebenar) tidak menjeda dan tidak menetapkan semula kiraan
// "Sedia": kod nasihat berselang OK setiap 200 ms + satu kelipan kritikal pendek setiap kitaran. Masa ambang SEBENAR (skala 1).
import { expect, test } from "@playwright/test";
import { bacaKonfig, bacaLang, bukti, lancar, type Lancar } from "./bantu.js";

const app = bacaKonfig();
const ms = bacaLang("ms");

let l: Lancar;
test.afterEach(async () => {
  await l?.tutup();
});

test("kod berkelip semasa LIHAT: tiada jeda, petunjuk nasihat stabil tanpa 'Dijeda', Sedia tetap muncul", async () => {
  test.setTimeout(90_000);
  l = await lancar("sim");
  const { win } = l;
  await win.locator("[data-uji=umur]").check();
  await win.locator("[data-uji=hidupkan]").click();
  const lihat = win.locator("[data-uji=lihat]");
  await expect(lihat).toHaveAttribute("data-keadaan", "hidup", { timeout: 10_000 });

  // Jujukan dalam halaman (pemasa renderer, bukan pusingan IPC Playwright): 12 kitaran × 2.4 s ≈ 29 s > masa "Sedia".
  const tempohS = app.aliran.lihat_sedia_selepas_stabil_s + 5;
  const pantau = win.evaluate(
    ({ ms_, kitaran }) =>
      new Promise<{ dijeda: number; teks: string[]; sediaMs: number | null }>((selesai) => {
        const uji = (globalThis as unknown as { degupUji: { petunjuk(k: number): void } }).degupUji;
        const corak = [12, 0, 11, 0, 7, 0, 1, 0, 0, 0, 0, 0];
        type El = { getAttribute(a: string): string | null; hidden: boolean; textContent: string | null; disabled?: boolean };
        const doc = (globalThis as unknown as { document: { querySelector(s: string): El | null } }).document;
        const akar = () => doc.querySelector("[data-uji=lihat]");
        const kotak = () => doc.querySelector("[data-uji=petunjuk]");
        let i = 0;
        let dijeda = 0;
        let sediaMs: number | null = null;
        const mula = performance.now();
        const teks = new Set<string>();
        const p = setInterval(() => {
          uji.petunjuk(corak[i % corak.length]!);
          if (akar()?.getAttribute("data-keadaan") === "dijeda") dijeda++;
          if (sediaMs === null && doc.querySelector("[data-uji=sedia]")?.disabled === false) sediaMs = performance.now() - mula;
          const k = kotak();
          if (k && !k.hidden) teks.add(k.textContent ?? "");
          if (++i >= kitaran * corak.length) {
            clearInterval(p);
            uji.petunjuk(0);
            selesai({ dijeda, teks: [...teks], sediaMs });
          }
        }, ms_);
      }),
    { ms_: 200, kitaran: Math.ceil((tempohS * 1000) / (200 * 12)) },
  );
  await expect(win.locator("[data-uji=petunjuk]")).toBeVisible({ timeout: 3_000 });
  await bukti(win, "lihat-kelip-ms", "k2");
  const hasil = await pantau;
  // "Sedia" dibuka SEMASA jujukan berkelip berjalan (kiraan tidak ditetapkan semula), tiada jeda sepanjangnya.
  expect(hasil.dijeda).toBe(0);
  expect(hasil.sediaMs).not.toBeNull();
  expect(hasil.sediaMs!).toBeLessThan(tempohS * 1000);
  await expect(win.locator("[data-uji=sedia]")).toBeEnabled();
  expect(hasil.teks.length).toBeGreaterThan(0);
  for (const t of hasil.teks) expect(t).not.toContain(ms.petunjuk.dijeda);
  await expect(win.locator("[data-uji=petunjuk]")).toBeHidden({ timeout: 5_000 });
  await expect(win.locator("[data-uji=masih-mencari]")).toBeHidden();
  await expect(lihat).toHaveAttribute("data-keadaan", "hidup");
});
