#!/usr/bin/env node
// Asap laluan LANGSUNG tanpa muka (P1a): Electron sebenar, sumber `live`, kamera palsu Chromium (corak bergerak, tiada orang),
// kunci dari env SMARTSPECTRA_API_KEY atau `.env` repo (tidak pernah dicetak). Memakai kredit Presage: rekod dalam docs/MEASUREMENTS.md.
// Bukan bukti isyarat manusia: hanya laluan kod (jambatan, pengesahan kunci, petunjuk tiada muka, Esc).
//
// Guna (hos, selepas `node esbuild.config.mjs`), paparan bebas dipilih seperti scripts/gerbang-ujian.sh (xvfb-run -a di hos dikongsi
// boleh keluar 1 walaupun arahan lulus):
//   ~/ops/autopilot/bin/ujian-pelayar.sh xvfb-run -a -n <paparan bebas> node scripts/asap-live.mjs [--out f.json]
// Tangkapan petunjuk tiada muka ke $AUTOPILOT_BUKTI_DIR bila ditetapkan.
// Keluar: 0 = semua semakan lulus · 1 = semakan gagal · 2 = kunci tiada · 3 = kunci ditolak · 4 = kredit habis.
import { _electron as electron } from "@playwright/test";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { parseArgs } from "node:util";
import { AKAR, muatTs } from "./muat-ts.mjs";

const { values: o } = parseArgs({ options: { out: { type: "string" } } });
const app = JSON.parse(readFileSync(join(AKAR, "config/app.json"), "utf8"));
const kfg = app.p1.asap_live;
const lang = JSON.parse(readFileSync(join(AKAR, `lang/${kfg.bahasa}.json`), "utf8"));

const alat = await muatTs("src/alat/asap-p1.ts");
const failEnv = join(AKAR, ".env");
const kunci = alat.kunciDariEnv(existsSync(failEnv) ? readFileSync(failEnv, "utf8") : null, process.env);
if (!kunci) {
  console.error("SMARTSPECTRA_API_KEY tiada (env atau .env repo)");
  process.exit(2);
}
if (!existsSync(join(AKAR, "dist/main.cjs"))) {
  console.error("dist/ tiada: jalankan node esbuild.config.mjs dahulu");
  process.exit(2);
}

const data = mkdtempSync(join(tmpdir(), "degup-asap-live-"));
const env = {};
for (const [k, v] of Object.entries(process.env)) if (v !== undefined) env[k] = v;
Object.assign(env, { [app.sumber_env]: "live", DEGUP_DATA: data, DEGUP_UJI_STORAN_ASAS: "1", SMARTSPECTRA_API_KEY: kunci });

/** Teks konsol dirumus tanpa kunci (pertahanan: SDK tidak sepatutnya mencetaknya). */
const bersih = (s) => String(s).split(kunci).join("<kunci>").slice(0, 300);
const hasil = { semakan: {}, konsol: [], ipc_baharu: [], masa_sdk_s: null, ralat_mula: null };
const semak = (nama, lulus, nota) => (hasil.semakan[nama] = nota === undefined ? { lulus } : { lulus, nota });
const mulaSdk = { t: null };
const tempohSdk = () => (mulaSdk.t === null ? 0 : Math.round((Date.now() - mulaSdk.t) / 100) / 10);

let electronApp;
let rc = 1;
try {
  electronApp = await electron.launch({
    args: ["--no-sandbox", "--password-store=basic", `--lang=${kfg.bahasa}`, ...kfg.suis_chromium, "."],
    cwd: AKAR,
    env,
  });
  const win = await electronApp.firstWindow();
  win.on("console", (m) => {
    if (m.type() === "error" || m.type() === "warning" || /Content Security Policy|Refused to/i.test(m.text()))
      hasil.konsol.push({ jenis: m.type(), teks: bersih(m.text()) });
  });
  win.on("pageerror", (e) => hasil.konsol.push({ jenis: "pageerror", teks: bersih(e.message) }));
  await electronApp.evaluate(({ BrowserWindow }, s) => BrowserWindow.getAllWindows()[0]?.setContentSize(s.lebar, s.tinggi), app.tetingkap);
  await win.waitForSelector("[data-uji=senarai-izin]");

  semak("jambatan_preload", await win.evaluate(() => typeof window.__smartspectraBridge === "object" && window.__smartspectraBridge !== null));
  const ipcSebelum = await electronApp.evaluate(({ ipcMain }) => ipcMain.eventNames().map(String));

  await win.locator("[data-uji=umur]").check();
  mulaSdk.t = Date.now();
  await win.locator("[data-uji=hidupkan]").click();

  // Ralat mula (kunci ditolak, kredit habis, SDK gagal dimuat) = skrin izin dengan ayat ralat.
  const lihat = win.locator("[data-uji=lihat]");
  const ralat = win.locator("[data-uji=ralat-mula]");
  await Promise.race([lihat.waitFor({ timeout: kfg.tunggu_berjalan_s * 1000 }), ralat.waitFor({ timeout: kfg.tunggu_berjalan_s * 1000 })]).catch(() => {});
  if (await ralat.isVisible()) {
    const teks = (await ralat.textContent()) ?? "";
    hasil.ralat_mula = Object.entries(lang.live).find(([, v]) => v === teks)?.[0] ?? "lain";
  }
  const ipcSelepas = await electronApp.evaluate(({ ipcMain }) => ipcMain.eventNames().map(String));
  hasil.ipc_baharu = ipcSelepas.filter((n) => !ipcSebelum.includes(n));
  semak("bindSmartSpectraIpc_terikat", hasil.ipc_baharu.length > 0, hasil.ipc_baharu.length);

  // Babak LIHAT: kod 1 (kNoFaceFound) dari SDK menjeda dan memaparkan petunjuk tiada muka.
  const petunjuk = win.locator(`[data-uji=petunjuk][data-kod="${kfg.kod_tiada_muka}"]`);
  const adaPetunjuk = hasil.ralat_mula === null && (await petunjuk.waitFor({ state: "visible", timeout: kfg.tunggu_petunjuk_s * 1000 }).then(() => true, () => false));
  const teksPetunjuk = adaPetunjuk ? ((await petunjuk.textContent()) ?? "") : "";
  semak("petunjuk_tiada_muka", adaPetunjuk && teksPetunjuk.includes(lang.petunjuk.tiada_muka), bersih(teksPetunjuk));
  if (adaPetunjuk && process.env.AUTOPILOT_BUKTI_DIR) await win.screenshot({ path: join(process.env.AUTOPILOT_BUKTI_DIR, "degup-p1a-tiada-muka-en.png") });

  // Panel Data: pengesahan kunci = Yes (SDK mencapai kRunning).
  if (hasil.ralat_mula === null) {
    await win.locator("[data-uji=buka-data]").click();
    const dd = win.locator("[data-uji=panel-data] [data-uji=data-pengesahan] dd");
    const ya = await dd.filter({ hasText: lang.data.ya }).waitFor({ timeout: kfg.tunggu_berjalan_s * 1000 }).then(() => true, () => false);
    semak("data_pengesahan_ya", ya, bersih((await dd.textContent()) ?? ""));
    if (process.env.AUTOPILOT_BUKTI_DIR) await win.screenshot({ path: join(process.env.AUTOPILOT_BUKTI_DIR, "degup-p1a-data-en.png") });
    await win.keyboard.press("Escape"); // tutup dialog
    await win.locator("[data-uji=panel-data]").waitFor({ state: "hidden", timeout: 5000 }).catch(() => {});
  } else semak("data_pengesahan_ya", false, hasil.ralat_mula);

  // Esc: kamera mati (tiada trek video hidup), kembali ke izin.
  await win.keyboard.press("Escape");
  const izin = await win.locator("[data-uji=senarai-izin]").waitFor({ timeout: 10_000 }).then(() => true, () => false);
  const kameraHidup = await win.locator("[data-uji=kamera-hidup]").count();
  hasil.masa_sdk_s = tempohSdk();
  semak("esc_matikan_kamera", izin && kameraHidup === 0, { izin, kameraHidup });

  const csp = hasil.konsol.filter((k) => /Content Security Policy|Refused to/i.test(k.teks));
  semak("tiada_csp", csp.length === 0, csp.length);
  semak("tiada_ralat_konsol", hasil.konsol.filter((k) => k.jenis === "error" || k.jenis === "pageerror").length === 0);
  semak("masa_sdk_dalam_had", hasil.masa_sdk_s <= kfg.had_sdk_s, hasil.masa_sdk_s);

  rc = hasil.ralat_mula === "ralat_kunci" ? 3 : hasil.ralat_mula === "ralat_kredit" ? 4 : Object.values(hasil.semakan).every((s) => s.lulus) ? 0 : 1;
} catch (e) {
  hasil.pengecualian = bersih(e?.message ?? e);
} finally {
  await electronApp?.close().catch(() => {});
  rmSync(data, { recursive: true, force: true });
}

hasil.rc = rc; // kod keluar pembalut (xvfb-run) boleh berbeza: medan ini ialah keputusan skrip
const json = JSON.stringify(hasil, null, 2) + "\n";
if (o.out) writeFileSync(o.out, json);
process.stdout.write(json);
process.exit(rc);
