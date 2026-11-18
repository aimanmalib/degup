// J2 (PH§5.2 J2.4, J2.5, J2.6, J2.7): lencana Live dengan versi SDK, bahasa lalai ikut locale OS, izin perkara 3 + 4, tiada suis History.
import { expect, test } from "@playwright/test";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { bacaKonfig, bacaLang, bukti, lancar, type Lancar } from "./bantu.js";

const app = bacaKonfig();
const ms = bacaLang("ms");
const en = bacaLang("en");

let l: Lancar | undefined;
test.afterEach(async () => {
  await l?.tutup();
  l = undefined;
});

test("locale OS en-US → EN; sumber live → lencana Live dengan versi SDK; izin perkara 3 + 4", async () => {
  l = await lancar("live", {}, ["--lang=en-US"]);
  const { win } = l;
  await expect(win.locator("h1")).toHaveText(en.izin.tajuk);
  await expect(win.locator("html")).toHaveAttribute("lang", "en");
  const lencana = win.locator("[data-uji=lencana-sumber]");
  await expect(lencana).toHaveText(en.umum.langsung.replace("{versi}", app.sdk.versi));
  await expect(lencana).not.toHaveText(en.umum.simulasi);
  await expect(win.getByText(en.izin.perkara["3"].teks)).toBeVisible();
  await expect(win.getByText(en.izin.perkara["4"].teks)).toBeVisible();
  expect(await win.locator("html").evaluate((el) => el.scrollWidth - el.clientWidth)).toBeLessThanOrEqual(0);
  await bukti(win, "izin-live-en", "j2");

  await win.getByRole("button", { name: ms.bahasa.ms_penuh }).click();
  await expect(lencana).toHaveText(ms.umum.langsung.replace("{versi}", app.sdk.versi));
  await bukti(win, "izin-live-ms", "j2");
});

test("locale OS ms-MY → BM; tetapan tersimpan pengguna menang atas locale", async () => {
  l = await lancar("sim", {}, ["--lang=ms-MY"]);
  await expect(l.win.locator("h1")).toHaveText(ms.izin.tajuk);
  await l.tutup();

  const data = mkdtempSync(join(tmpdir(), "degup-e2e-j2-"));
  try {
    writeFileSync(join(data, "tetapan.json"), JSON.stringify({ bahasa: "en" }));
    l = await lancar("sim", { DEGUP_DATA: data }, ["--lang=ms-MY"]);
    await expect(l.win.locator("h1")).toHaveText(en.izin.tajuk);
  } finally {
    await l?.app.close();
    l = undefined;
    rmSync(data, { recursive: true, force: true });
  }
});

test("Tetapan: tiada suis History; bantuan padam menyebut kad dan video kekal", async () => {
  l = await lancar("sim", {}, ["--lang=en-US"]);
  const { win } = l;
  await win.locator("[data-uji=buka-tetapan]").click();
  await expect(win.getByText(en.tetapan.padam_bantuan)).toBeVisible();
  await expect(win.locator("[data-uji=sejarah]")).toHaveCount(0);
  await expect(win.getByText("History", { exact: true })).toHaveCount(0);
  await bukti(win, "tetapan-en", "j2");
  await win.keyboard.press("Escape"); // helaian modal menutup bar atas
  await win.getByRole("button", { name: ms.bahasa.ms_penuh }).click();
  await win.locator("[data-uji=buka-tetapan]").click();
  await expect(win.getByText(ms.tetapan.padam_bantuan)).toBeVisible();
  await bukti(win, "tetapan-ms", "j2");
});
