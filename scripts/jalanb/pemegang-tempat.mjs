#!/usr/bin/env node
// Raptai jalan B (PH§5.5 K3 c): video pemegang tempat TANPA muka sesiapa = corak ujian ffmpeg (testsrc2) + trek audio ketukan
// sintetik pada saat diketahui + hingar latar dan letusan hingar. Nilai = config/jalanb.json `pemegang_tempat`.
// Fail kekal dalam folder rahsia: tidak ke FILE DROP, tidak didaftar dalam hantar.json, tidak diterbit.
// Guna: node scripts/jalanb/pemegang-tempat.mjs [--folder <dalam folder_rahsia>]
// Hasil: <folder>/<awalan>ujian.mp4 (1280×720 30 fps h264 + aac 48 kHz) dan <folder>/<awalan>ketukan-diketahui.json.
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, realpathSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join, resolve, sep } from "node:path";
import { parseArgs } from "node:util";
import { AKAR, muatTs } from "../muat-ts.mjs";

const J = JSON.parse(readFileSync(join(AKAR, "config/jalanb.json"), "utf8"));
const rahsia = J.folder_rahsia.replace(/^~\//, homedir() + "/");
const { values: o } = parseArgs({ options: { folder: { type: "string", default: join(rahsia, "k3") } } });
mkdirSync(rahsia, { recursive: true, mode: 0o700 });
const folder = resolve(o.folder);
mkdirSync(folder, { recursive: true, mode: 0o700 });
if (!(realpathSync(folder) + sep).startsWith(realpathSync(rahsia) + sep)) throw new Error(`folder mesti dalam ${J.folder_rahsia}`);

const { masaPemegangTempat, grafAudioPemegangTempat } = await muatTs("src/alat/jalanb.ts");
const pt = J.pemegang_tempat;
const ketukan_s = masaPemegangTempat(pt);
const sr = 48000;
const mp4 = join(folder, `${pt.awalan}ujian.mp4`);
const t = Date.now();
execFileSync("ffmpeg", [
  "-hide_banner", "-loglevel", "error", "-y",
  "-f", "lavfi", "-i", `testsrc2=s=1280x720:r=30:d=${pt.tempoh_s}`,
  "-f", "lavfi", "-i", grafAudioPemegangTempat(pt, ketukan_s, sr).replace(/\[a\]$/, "[out0]"),
  "-map", "0:v", "-map", "1:a", "-c:v", "libx264", "-preset", "veryfast", "-pix_fmt", "yuv420p", "-c:a", "aac", "-ac", "1", "-b:a", "128k",
  "-shortest", mp4,
]);
const json = join(folder, `${pt.awalan}ketukan-diketahui.json`);
writeFileSync(json, JSON.stringify({ _nota: "Pemegang tempat K3: saat dari bingkai pertama. Tiada muka.", ketukan_s }, null, 2) + "\n");
console.log(JSON.stringify({ mp4, json, ketukan: ketukan_s.length, saat_jana: Math.round((Date.now() - t) / 1000) }));
