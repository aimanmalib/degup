// P4a (PRD §4.9, §4.10, §4.11): perakam demo (tetingkap sendiri → webm dalam Video/Degup, petunjuk RAKAM, berhenti sendiri
// selepas keputusan) dan sumber live tanpa kunci (kamera tiruan Chromium; SDK TIDAK dimuat, tiada kredit dipakai).
import { expect, test } from "@playwright/test";
import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { bacaLang, bukti, lancar, type Lancar } from "./bantu.js";

const ms = bacaLang("ms");

let l: Lancar | null = null;
test.afterEach(async () => {
  await l?.tutup();
  l = null;
});

const videoDitulis = (data: string) => {
  const f = join(data, "video", "Degup");
  try {
    return readdirSync(f).filter((x) => x.endsWith(".webm")).map((x) => ({ x, saiz: statSync(join(f, x)).size }));
  } catch {
    return [];
  }
};

test("Rakam demo dari skrin izin: petunjuk RAKAM, henti, fail webm dalam Video/Degup dan dalam panel Data", async () => {
  l = await lancar("sim");
  const { win } = l;
  await win.locator("[data-uji=rakam-demo]").click();
  await expect(win.locator("[data-uji=rakam-hidup]")).toBeVisible();
  await expect(win.locator("[data-uji=rakam-hidup]")).toContainText(ms.rakam.petunjuk);
  await expect(win.locator("[data-uji=rakam-demo]")).toHaveText(ms.rakam.henti);
  await bukti(win, "rakam-izin", "p4a");
  await win.waitForTimeout(2500);
  await win.locator("[data-uji=rakam-henti]").click();
  await expect(win.locator("[data-uji=rakam-hidup]")).toHaveCount(0);
  await expect(win.locator("[data-uji=rakam-mesej]")).toContainText(/degup-demo-\d{8}-\d{6}\.webm/);
  const v = videoDitulis(l.data);
  expect(v).toHaveLength(1);
  expect(v[0]!.saiz).toBeGreaterThan(1000);
  await win.locator("[data-uji=buka-data]").click();
  await expect(win.locator("[data-uji=data-fail]")).toContainText(v[0]!.x);
});

test("Rakam demo dari Tetapan; rakaman berhenti sendiri selepas skrin keputusan", async () => {
  test.setTimeout(150_000);
  l = await lancar("sim", { DEGUP_SKALA_MASA: "0.1" });
  const { win } = l;
  await win.locator("[data-uji=buka-tetapan]").click();
  await expect(win.getByRole("heading", { name: ms.rakam.tajuk })).toBeVisible();
  await win.locator("[data-uji=panel-tetapan] [data-uji=rakam-demo]").click();
  await expect(win.locator("[data-uji=rakam-hidup]")).toBeVisible();
  await bukti(win, "rakam-tetapan", "p4a");
  await win.keyboard.press("Escape");
  await win.locator("[data-uji=umur]").check();
  await win.locator("[data-uji=hidupkan]").click();
  // Aliran penuh dipendekkan (skala ujian); butang ke babak seterusnya ditekan bila muncul (LIHAT sedia, pendedahan, LENTUR).
  const keKeputusan = async () => {
    const seterusnya = win.locator("[data-uji=sedia]:visible, [data-uji=teruskan]:visible, [data-uji=ke-keputusan]:visible");
    for (let i = 0; i < 200 && !(await win.locator("#pentas[data-skrin=keputusan]").count()); i++) {
      if (await seterusnya.count()) await seterusnya.first().click({ timeout: 2000 }).catch(() => {});
      await win.waitForTimeout(500);
    }
  };
  await keKeputusan();
  await expect(win.locator("#pentas")).toHaveAttribute("data-skrin", "keputusan");
  await expect(win.locator("[data-uji=rakam-hidup]")).toBeVisible();
  await expect(win.locator("[data-uji=rakam-hidup]")).toHaveCount(0, { timeout: 15_000 });
  await expect(win.locator("[data-uji=rakam-mesej]")).toBeVisible();
  expect(videoDitulis(l.data)).toHaveLength(1);
});

test("live tanpa kunci: kamera tiruan dibuka, SDK tidak dimulakan, ralat kunci dipapar, kamera ditutup", async () => {
  l = await lancar("live", {}, ["--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream"]);
  const { win } = l;
  await win.locator("[data-uji=umur]").check();
  await win.locator("[data-uji=hidupkan]").click();
  await expect(win.locator("[data-uji=ralat-mula]")).toHaveText(ms.live.ralat_kunci);
  await expect(win.locator("[data-uji=kamera-hidup]")).toHaveCount(0);
  await expect(win.locator("#pentas")).toHaveAttribute("data-skrin", "izin");
  await bukti(win, "live-tiada-kunci", "p4a");
});
