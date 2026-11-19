#!/usr/bin/env node
// P8a placeholder footage: one Simulation round recorded by the app's own demo recorder, with a cut map for sunting.mjs.
// The output NEVER leaves the secrets folder and is never published or registered (it shows the Simulation label).
// Guna (hos, xvfb): node esbuild.config.mjs && xvfb-run -a node scripts/video/rakam-pemegang-tempat.mjs [--folder <dalam folder_rahsia>]
// Hasil: <folder>/data/video/Degup/degup-demo-*.webm, <folder>/peta.json, <folder>/ketukan.json.
import { _electron as electron } from "@playwright/test";
import { mkdirSync, readFileSync, readdirSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join, relative, resolve, sep } from "node:path";
import { parseArgs } from "node:util";
import { AKAR } from "../muat-ts.mjs";

const K = JSON.parse(readFileSync(join(AKAR, "config/video.json"), "utf8"));
const rahsia = K.folder_rahsia.replace(/^~\//, homedir() + "/");
const { values: o } = parseArgs({ options: { folder: { type: "string", default: join(rahsia, "p8a") } } });
mkdirSync(rahsia, { recursive: true, mode: 0o700 });
const folder = resolve(o.folder);
mkdirSync(folder, { recursive: true, mode: 0o700 });
if (!(realpathSync(folder) + sep).startsWith(realpathSync(rahsia) + sep)) throw new Error(`folder mesti dalam ${K.folder_rahsia}`);
const data = join(folder, "data");
rmSync(data, { recursive: true, force: true });

const env = { ...process.env, DEGUP_SUMBER: "sim", DEGUP_DATA: data, DEGUP_UJI_STORAN_ASAS: "1", DEGUP_TETINGKAP: "rakam" };
delete env.SMARTSPECTRA_API_KEY;
const app = await electron.launch({ cwd: AKAR, args: ["--no-sandbox", "--password-store=basic", "--lang=en", "."], env });
const win = await app.firstWindow();
const pengawal = setTimeout(() => {
  console.error("tamat masa: rakaman tidak siap");
  app.close().finally(() => process.exit(5));
}, 420_000);
await win.waitForSelector("[data-uji=senarai-izin]");
const tunggu = (s) => win.waitForTimeout(s * 1000);
const skrin = () => win.locator("#pentas").getAttribute("data-skrin");

await win.locator("[data-uji=rakam-demo]").click();
await win.locator("[data-uji=rakam-hidup]").waitFor();
const t0 = Date.now();
const masa = {};
const tanda = async () => {
  const s = await skrin();
  if (s && !(s in masa)) masa[s] = (Date.now() - t0) / 1000;
};
await tanda();
await tunggu(16); // babak pembuka + izin (peta babak 1 dan 7)
await win.locator("[data-uji=umur]").check();
await win.locator("[data-uji=hidupkan]").click();
const sampai = async (nama, maksS) => {
  for (let i = 0; i < maksS * 4 && (await skrin()) !== nama; i++) await tunggu(0.25);
  await tanda();
  console.error(`skrin ${await skrin()} @ ${((Date.now() - t0) / 1000).toFixed(1)} s`);
  if ((await skrin()) !== nama) throw new Error(`skrin ${nama} tidak sampai`);
};
await sampai("lihat", 20);
await tunggu(28);
await win.locator("[data-uji=sedia]").click({ timeout: 90_000 });
await sampai("rasa", 10);
const ketukanUs = [];
const kotak = await win.locator("[data-uji=rasa]").boundingBox();
for (let t = 0; t < 34; ) {
  const jeda = 0.75 + ((ketukanUs.length * 0.618) % 1) * 0.3;
  await tunggu(jeda);
  t += jeda;
  await win.mouse.click(kotak.x + kotak.width / 2, kotak.y + kotak.height * 0.8);
  ketukanUs.push(Date.now() * 1000);
}
await sampai("dedah", 30);
await tunggu(18);
await win.locator("[data-uji=teruskan]").click();
await sampai("lentur", 10);
await win.locator("[data-uji=ke-keputusan]").click({ timeout: 90_000 });
await sampai("keputusan", 10);
await win.locator("[data-uji=rakam-hidup]").waitFor({ state: "detached", timeout: 30_000 });
await app.close();
clearTimeout(pengawal);

const vid = join(data, "video", "Degup");
const webm = readdirSync(vid).filter((f) => f.endsWith(".webm"));
if (webm.length !== 1) throw new Error(`jangka 1 webm, dapat ${webm.length}`);
writeFileSync(join(folder, "ketukan.json"), JSON.stringify({ ketukan: ketukanUs }) + "\n");
const m = (s, d = 0) => +(masa[s] + d).toFixed(2);
const peta = {
  _nota: "P8a pemegang tempat (mod sim). Tidak diterbit, tidak didaftar.",
  sumber: { utama: relative(folder, join(vid, webm[0])) },
  babak: [
    { sumber: "utama", mula: m("izin") },
    { sumber: "utama", mula: m("lihat", 2) },
    { sumber: "utama", mula: m("lihat", 14) },
    { sumber: "utama", mula: m("rasa", 2) },
    { sumber: "utama", mula: m("dedah") },
    { sumber: "utama", mula: m("lentur", 5) },
    { sumber: "utama", mula: m("izin", 1) },
    { sumber: "utama", mula: m("lentur", 30) },
    { kad: true },
  ],
  ketukan: { fixture: "ketukan.json", sumber: "utama", sumber_mula_us: t0 * 1000 },
};
writeFileSync(join(folder, "peta.json"), JSON.stringify(peta, null, 2) + "\n");
console.log(JSON.stringify({ masa, ketukan: ketukanUs.length, webm: webm[0] }));
