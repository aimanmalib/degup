// J8: halaman Simulation pelayar `docs/sim/` (bundel statik renderer app + jambatan pelayar, tiada SDK, tiada kamera).
// Dibuka dari pelayan statik dalam tetingkap Electron KOSONG (tiada preload = Chromium biasa): tiga babak LIHAT, RASA, LENTUR,
// lencana Simulation pada setiap skrin, kad PNG dimuat turun, tiada ralat konsol, tiada permintaan rangkaian keluar.
import { _electron as electron, expect, test, type ElectronApplication, type Page } from "@playwright/test";
import { mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { bacaKonfig, bacaLang, bukti } from "./bantu.js";
import { pelayanStatik } from "./pelayan-statik.js";

const app = bacaKonfig();
const en = bacaLang("en");
const SKALA = 0.25;
const AKAR = fileURLToPath(new URL(`../${app.sim_web.folder}/`, import.meta.url));

let e: ElectronApplication | undefined;
let tutupPelayan: (() => Promise<void>) | undefined;
let muat = "";
test.afterEach(async () => {
  await e?.close();
  await tutupPelayan?.();
  if (muat) rmSync(muat, { recursive: true, force: true });
});

async function lencana(win: Page): Promise<void> {
  await expect(win.locator("[data-uji=lencana-sumber]")).toHaveText(en.umum.simulasi);
}

test("sim web: izin → LIHAT → RASA → pendedahan → LENTUR → keputusan, lencana Simulation, kad dimuat turun", async () => {
  test.setTimeout(150_000);
  const p = await pelayanStatik(AKAR);
  tutupPelayan = p.tutup;
  muat = mkdtempSync(join(tmpdir(), "degup-simweb-"));
  const env: Record<string, string> = {};
  for (const [k, v] of Object.entries(process.env)) if (v !== undefined && k !== "SMARTSPECTRA_API_KEY") env[k] = v;
  env.DEGUP_SIM_WEB_URL = `${p.url}?${app.sim_web.param_skala}=${SKALA}`;
  env.DEGUP_SIM_WEB_MUAT = muat;
  const skrip = fileURLToPath(new URL("./sim-web-tetingkap.cjs", import.meta.url));
  e = await electron.launch({ args: ["--no-sandbox", "--lang=en-US", skrip], env });
  const win = await e.firstWindow();
  const ralat: string[] = [];
  const luar: string[] = [];
  win.on("console", (m) => m.type() === "error" && ralat.push(m.text()));
  win.on("pageerror", (x) => ralat.push(String(x)));
  win.on("request", (q) => !q.url().startsWith(p.url) && !q.url().startsWith("blob:") && !q.url().startsWith("data:") && luar.push(q.url()));
  await win.waitForSelector("[data-uji=senarai-izin]");

  // Izin: bahasa dari locale pelayar, lencana Simulation, tiada jambatan preload/SDK.
  await expect(win.locator("html")).toHaveAttribute("lang", "en");
  await lencana(win);
  expect(await win.evaluate(() => "__smartspectraBridge" in globalThis)).toBe(false);
  await bukti(win, "izin-en", "j8");
  await win.locator("[data-uji=umur]").check();
  await win.locator("[data-uji=hidupkan]").click();

  // LIHAT (babak 1): pratonton sim (tiada kamera), BPM, Sedia.
  await expect(win.locator("[data-uji=lihat]")).toHaveAttribute("data-keadaan", "hidup", { timeout: 15_000 });
  await expect(win.locator("[data-uji=pratonton-sim]")).toHaveText(en.kamera.simulasi);
  await expect(win.locator("[data-uji=bpm]")).toHaveText(/^\d{2,3}$/);
  await lencana(win);
  await bukti(win, "lihat-en", "j8");
  await win.locator("[data-uji=sedia]").click({ timeout: (app.aliran.lihat_sedia_selepas_stabil_s * SKALA + 10) * 1000 });

  // RASA (babak 2): ketukan sefasa melalui cangkuk ujian sim → pendedahan Selaras.
  await expect(win.locator("[data-uji=rasa]")).toBeVisible();
  await lencana(win);
  await bukti(win, "rasa-en", "j8");
  await win.waitForTimeout(app.aliran.rasa_s * SKALA * 1000 - 1500);
  const n = await win.evaluate(() => (globalThis as unknown as { degupUji: { ketukSefasa(m: number): number } }).degupUji.ketukSefasa(150));
  expect(n).toBeGreaterThanOrEqual(app.rasa.n_min);
  await expect(win.locator("[data-uji=jalur]")).toHaveAttribute("data-jalur", "selaras", { timeout: 10_000 });
  await lencana(win);
  await win.waitForTimeout(app.dedah.kiraan_ms + 300);
  await bukti(win, "dedah-en", "j8");
  await win.locator("[data-uji=teruskan]").click();

  // LENTUR (babak 3): panduan nafas, jalur sela hidup, ringkasan ms.
  await expect(win.locator("[data-uji=lentur]")).toHaveAttribute("data-keadaan", "bernafas");
  await lencana(win);
  await expect.poll(async () => Number(await win.locator("[data-uji=sela]").getAttribute("data-n")), { timeout: 15_000 }).toBeGreaterThan(3);
  await bukti(win, "lentur-en", "j8");
  await expect(win.locator("[data-uji=lentur-hujung]")).toBeVisible({ timeout: (app.aliran.lentur_s * SKALA + 10) * 1000 });
  await win.locator("[data-uji=ke-keputusan]").click();

  // Keputusan: kad PNG dimuat turun oleh pelayar (saiz kanvas dari config).
  await expect(win.locator("[data-uji=keputusan]")).toBeVisible();
  await lencana(win);
  await win.locator("[data-uji=simpan-kad]").click();
  await expect(win.locator("[data-uji=status-kad]")).toHaveAttribute("data-nama", /\.png$/, { timeout: 10_000 });
  await expect.poll(() => readdirSync(muat).filter((f) => f.endsWith(".png")).length, { timeout: 10_000 }).toBe(1);
  const b = readFileSync(join(muat, readdirSync(muat).find((f) => f.endsWith(".png"))!));
  expect([b.readUInt32BE(16), b.readUInt32BE(20)]).toEqual([app.kad.lebar, app.kad.tinggi]);
  await bukti(win, "keputusan-en", "j8");
  expect(await win.locator("html").evaluate((el) => el.scrollWidth - el.clientWidth)).toBeLessThanOrEqual(0);

  expect(ralat).toEqual([]);
  expect(luar).toEqual([]);
});
