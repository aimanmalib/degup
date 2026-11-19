// K6 (PH§5.5): asap Windows di Depot (.depot/workflows/windows.yml). App sebenar dalam sumber `sim` selama DEGUP_ASAP_S saat
// (workflow memberi nilai; tiada = dilangkau, jadi gerbang Linux tidak membayar masa ini): izin → LIHAT berjalan, lencana
// Simulation, nadi sim bergerak, tiada ralat konsol atau halaman, Esc kembali ke izin. Tiada kunci, tiada kamera.
import { expect, test } from "@playwright/test";
import { bacaLang, bukti, lancar } from "./bantu.js";

const saat = Number(process.env.DEGUP_ASAP_S ?? 0);
const ms = bacaLang("ms");

test.skip(!(saat > 0), "DEGUP_ASAP_S tidak ditetapkan (hanya workflow Windows K6)");

test(`asap: sim berjalan ${saat} s tanpa ralat (platform ${process.platform})`, async () => {
  test.setTimeout((saat + 60) * 1000);
  const l = await lancar("sim");
  try {
    const { win } = l;
    const ralat: string[] = [];
    win.on("console", (m) => m.type() === "error" && ralat.push(m.text()));
    win.on("pageerror", (x) => ralat.push(String(x)));

    await win.locator("[data-uji=umur]").check();
    await win.locator("[data-uji=hidupkan]").click();
    const lihat = win.locator("[data-uji=lihat]");
    await expect(lihat).toHaveAttribute("data-keadaan", "hidup", { timeout: 15_000 });
    await expect(win.locator("[data-uji=lencana-sumber]")).toHaveText(ms.umum.simulasi);
    await win.waitForTimeout(saat * 1000);
    await expect(win.locator("[data-uji=lihat]").or(win.locator("[data-uji=rasa]"))).toBeVisible();
    await bukti(win, `asap-${process.platform}`, "k6");
    await win.keyboard.press("Escape");
    await expect(win.locator("h1")).toHaveText(ms.izin.tajuk);
    expect(ralat).toEqual([]);
  } finally {
    await l.tutup();
  }
});
