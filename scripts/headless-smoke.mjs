#!/usr/bin/env node
// Asap headless P1 (PRD §2 H1, H2): SDK SmartSpectra membaca video melalui `useFile()`; keluaran JSON angka sahaja
// (tiada kunci, tiada laluan, tiada imej) untuk `scripts/gerbang-p1.mjs`. Larian SEBENAR memakai kredit: rekod dalam docs/UKUR.md.
//
// Tukar video telefon (HEVC / kadar bingkai berubah) ke H.264 30 fps tetap DAHULU, dalam ~/degup-rahsia/:
//   ffmpeg -i in -vf fps=30 -c:v libx264 -pix_fmt yuv420p -an out.mp4
//
// Guna: node scripts/headless-smoke.mjs <video.mp4> [--out ringkasan.json] [--fixture fixture.json]
//         [--interframe-delay-ms N] [--start-offset-ms N] [--max-duration-ms N] [--had-s N]
// Kunci: env SMARTSPECTRA_API_KEY, atau baris itu dalam .env repo (tidak pernah dicetak).
// Linux tanpa Vulkan: VK_ICD_FILENAMES diisi dari config `sdk.vulkan_icd_linux` bila belum ditetapkan dan fail wujud.
// Keluar: 0 = larian siap · 2 = argumen/kunci tiada · 3 = kunci ditolak (kod 2) · 4 = kredit habis (kod 4) · 5 = ralat SDK lain / tamat masa.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseArgs } from "node:util";
import { AKAR, muatTs } from "./muat-ts.mjs";

const { values: o, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    out: { type: "string" },
    fixture: { type: "string" },
    "interframe-delay-ms": { type: "string" },
    "start-offset-ms": { type: "string" },
    "max-duration-ms": { type: "string" },
    "had-s": { type: "string" },
  },
});
const video = positionals[0];
if (!video || !existsSync(video)) {
  console.error("guna: node scripts/headless-smoke.mjs <video.mp4> [--out f.json] [--fixture f.json] (video mesti wujud)");
  process.exit(2);
}

const app = JSON.parse(readFileSync(join(AKAR, "config/app.json"), "utf8"));
const asap = app.p1.asap;
const nombor = (x, lalai) => (x === undefined ? lalai : Number(x));

const alat = await muatTs("src/alat/asap-p1.ts");
const failEnv = join(AKAR, ".env");
const kunci = alat.kunciDariEnv(existsSync(failEnv) ? readFileSync(failEnv, "utf8") : null, process.env);
if (!kunci) {
  console.error("SMARTSPECTRA_API_KEY tiada (env atau .env repo)");
  process.exit(2);
}

const icd = app.sdk.vulkan_icd_linux;
if (process.platform === "linux" && !process.env.VK_ICD_FILENAMES && icd && existsSync(icd)) process.env.VK_ICD_FILENAMES = icd;

const sdkMod = await import("@smartspectra/node-sdk");
const { decodeMetrics } = await import("@smartspectra/node-sdk/messages");
const kilang = {
  cipta: (opsyen) => new sdkMod.SmartSpectraSDK(opsyen),
  nyahkod: (buf) => decodeMetrics(buf),
  kumpulan: { cardio: sdkMod.cardioMetrics, breathing: sdkMod.breathingMetrics },
  versi: String(sdkMod.SmartSpectraSDK.version ?? app.sdk.versi),
};

const hasil = await alat.jalankanAsap(kilang, {
  video,
  kunci,
  fail: {
    interframeDelayMs: nombor(o["interframe-delay-ms"], asap.interframe_delay_ms),
    startOffsetMs: nombor(o["start-offset-ms"], asap.start_offset_ms),
    maxDurationMs: nombor(o["max-duration-ms"], asap.max_duration_ms),
  },
  hadMs: nombor(o["had-s"], asap.had_dinding_s) * 1000,
  metrik: app.sdk.metrik,
  beats: app.beats,
  p1: app.p1,
  fixture: o.fixture ? { skema: app.replay.skema, label: asap.label_fixture, tarikh: new Date().toISOString().slice(0, 10) } : undefined,
});

const json = JSON.stringify(hasil.ringkasan, null, 2) + "\n";
if (o.out) writeFileSync(o.out, json);
else process.stdout.write(json);
if (o.fixture && hasil.fixture) writeFileSync(o.fixture, JSON.stringify(hasil.fixture) + "\n");

const kod = hasil.ringkasan.ralat.map((r) => r.kod);
if (kod.includes(2)) { console.error("SDK: kunci ditolak (kAuthenticationFailed)"); process.exit(3); }
if (kod.includes(4)) { console.error("SDK: kredit habis (kCreditExhausted)"); process.exit(4); }
if (hasil.tamatMasa || hasil.ringkasan.ralat.some((r) => !r.boleh_ulang)) { console.error("SDK: ralat atau tamat masa (lihat JSON)"); process.exit(5); }
process.exit(0);
