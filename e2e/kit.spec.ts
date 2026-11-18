// J6a (PH§7.1, PELAN J6a): tetingkap rakaman 16:9 (env DEGUP_TETINGKAP=rakam, dan bila perakam demo mula) tanpa limpah,
// dan log diagnostik setempat ditulis (kepala dengan komit kit, saiz tetingkap). Sumber sim; tiada SDK, tiada kunci.
import { expect, test } from "@playwright/test";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { bacaKonfig, bukti, lancar, type Lancar } from "./bantu.js";

const konfig = bacaKonfig();
const SASARAN = [konfig.tetingkap.rakam.lebar, konfig.tetingkap.rakam.tinggi];

let l: Lancar | null = null;
test.afterEach(async () => {
  await l?.tutup();
  l = null;
});

const saizKandungan = (x: Lancar) => x.app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0]!.getContentSize());

/** Tiada limpahan mendatar/menegak pada halaman dan setiap panel/dialog yang terbuka. */
async function tiadaLimpah(x: Lancar): Promise<void> {
  const limpah = await x.win
    .locator("html, [role=dialog], dialog[open], aside, #pentas")
    .evaluateAll((els) => els.filter((e) => e.scrollWidth > e.clientWidth + 1).map((e) => `${e.tagName}#${e.id} ${e.scrollWidth}>${e.clientWidth}`));
  expect(limpah).toEqual([]);
  expect(await x.win.locator("html").evaluate((el) => el.scrollHeight - el.clientHeight)).toBeLessThanOrEqual(1);
}

const barisLog = (data: string) => {
  const f = join(data, konfig.log.folder);
  return readdirSync(f)
    .filter((x) => x.startsWith(konfig.log.awalan_fail))
    .flatMap((x) => readFileSync(join(f, x), "utf8").trim().split("\n"))
    .map((b) => JSON.parse(b));
};

test("DEGUP_TETINGKAP=rakam: kandungan 1600×900 dari awal, tiada limpah (izin, Tetapan, Data, LIHAT), log ditulis", async () => {
  l = await lancar("sim", { DEGUP_TETINGKAP: konfig.tetingkap.nilai_rakam, DEGUP_SKALA_MASA: "0.2" });
  const { win } = l;
  expect(await saizKandungan(l)).toEqual(SASARAN);
  expect(await win.locator("html").evaluate((el) => [el.clientWidth, el.clientHeight])).toEqual(SASARAN);
  await tiadaLimpah(l);
  await bukti(win, "rakam-izin-1600", "j6a");
  await win.locator("[data-uji=buka-tetapan]").click();
  await expect(win.locator("[data-uji=panel-tetapan]")).toBeVisible();
  await tiadaLimpah(l);
  await win.keyboard.press("Escape");
  await win.locator("[data-uji=buka-data]").click();
  await tiadaLimpah(l);
  await win.keyboard.press("Escape");
  await win.locator("[data-uji=umur]").check();
  await win.locator("[data-uji=hidupkan]").click();
  await expect(win.locator("#pentas")).toHaveAttribute("data-skrin", "lihat");
  await tiadaLimpah(l);
  await bukti(win, "rakam-lihat-1600", "j6a");

  const log = barisLog(l.data);
  expect(log[0]).toMatchObject({ jenis: "app", komit_kit: "dev", sumber: "sim" });
  expect(log).toContainEqual(expect.objectContaining({ jenis: "tetingkap", lebar: SASARAN[0], tinggi: SASARAN[1] }));
  expect(log).toContainEqual(expect.objectContaining({ jenis: "sesi", fasa: "mula", sumber: "sim" }));
});

test("Rakam demo dari tetingkap lalai: tetingkap bertukar ke 1600×900 sebelum rakaman, log merekod saiz", async () => {
  l = await lancar("sim");
  const { win } = l;
  expect(await saizKandungan(l)).toEqual([konfig.tetingkap.lebar, konfig.tetingkap.tinggi]);
  await win.locator("[data-uji=rakam-demo]").click();
  await expect(win.locator("[data-uji=rakam-hidup]")).toBeVisible();
  expect(await saizKandungan(l)).toEqual(SASARAN);
  await tiadaLimpah(l);
  await bukti(win, "rakam-mula-1600", "j6a");
  await win.locator("[data-uji=rakam-henti]").click();
  await expect(win.locator("[data-uji=rakam-hidup]")).toHaveCount(0);
  const tetingkap = barisLog(l.data).filter((b) => b.jenis === "tetingkap");
  expect(tetingkap.at(-1)).toMatchObject({ lebar: SASARAN[0], tinggi: SASARAN[1] });
});
