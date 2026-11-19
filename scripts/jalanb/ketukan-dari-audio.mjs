#!/usr/bin/env node
// Jalan B (PH§5.5 K3 a): trek audio video telefon pemilik → cap masa ketukan jari di meja (JSON), saat diukur dari bingkai VIDEO
// pertama (sesaran mula trek audio lawan trek video diambil dari ffprobe). Pengesan = src/alat/jalanb.ts `kesanKetukan`, nilai =
// config/jalanb.json `ketukan`. Audio tidak disimpan; hanya angka. Video pemilik kekal dalam folder rahsia.
// Guna: node scripts/jalanb/ketukan-dari-audio.mjs <video> [--keluar ketukan.json] [--diketahui masa.json]
//   --diketahui: JSON { ketukan_s: [...] } (pemegang tempat) → padanan + ralat dicetak; keluar 1 bila melepasi ralat_maks_ms.
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";
import { parseArgs } from "node:util";
import { AKAR, muatTs } from "../muat-ts.mjs";

const { values: o, positionals: p } = parseArgs({
  allowPositionals: true,
  options: { keluar: { type: "string" }, diketahui: { type: "string" } },
});
if (p.length !== 1) {
  console.error("guna: ketukan-dari-audio.mjs <video> [--keluar f.json] [--diketahui masa.json]");
  process.exit(2);
}
const K = JSON.parse(readFileSync(join(AKAR, "config/jalanb.json"), "utf8")).ketukan;
const { kesanKetukan, padanKetukan } = await muatTs("src/alat/jalanb.ts");
const video = p[0];

const probe = JSON.parse(execFileSync("ffprobe", ["-v", "error", "-show_streams", "-show_format", "-of", "json", video], { encoding: "utf8" }));
const sv = probe.streams.find((s) => s.codec_type === "video");
const sa = probe.streams.find((s) => s.codec_type === "audio");
if (!sa) {
  console.error("tiada trek audio dalam video");
  process.exit(3);
}
const sesaran = (Number(sa.start_time) || 0) - (Number(sv?.start_time) || 0);
const pcm = execFileSync(
  "ffmpeg",
  ["-hide_banner", "-loglevel", "error", "-i", video, "-map", "0:a:0", "-af", K.penapis_ffmpeg, "-ac", "1", "-ar", String(K.kadar_sampel), "-f", "f32le", "-"],
  { maxBuffer: 1 << 30 },
);
const x = new Float32Array(pcm.buffer, pcm.byteOffset, pcm.byteLength / 4);
// julat_s dalam saat VIDEO; PCM bermula pada `sesaran`.
const julat = K.julat_s ? [K.julat_s[0] - sesaran, K.julat_s[1] - sesaran] : undefined;
const h = kesanKetukan(x, { ...K, julat_s: julat });
const ketukan_s = h.ketukan_s.map((t) => Math.round((t + sesaran) * 1000) / 1000);
const hasil = {
  _nota: "Saat dari bingkai video pertama. Angka sahaja; tiada audio.",
  video: basename(video),
  tempoh_s: Number(probe.format.duration),
  sesaran_audio_s: Math.round(sesaran * 1000) / 1000,
  julat_s: K.julat_s ?? null,
  puncak_rms: +h.puncak.toFixed(5),
  lantai_median_rms: +h.lantai_median.toFixed(5),
  bilangan: ketukan_s.length,
  ketukan_s,
};
let rc = 0;
if (o.diketahui) {
  const dik = JSON.parse(readFileSync(o.diketahui, "utf8")).ketukan_s;
  const pd = padanKetukan(dik, ketukan_s, K.ralat_maks_ms / 1000);
  hasil.padanan = { diketahui: dik.length, padan: pd.padan, terlepas: pd.terlepas, palsu: pd.palsu, ralat_maks_ms: +pd.ralat_maks_ms.toFixed(1) };
  rc = pd.terlepas === 0 && pd.palsu === 0 && pd.ralat_maks_ms <= K.ralat_maks_ms ? 0 : 1;
}
if (o.keluar) writeFileSync(o.keluar, JSON.stringify(hasil, null, 2) + "\n");
console.log(JSON.stringify({ ...hasil, ketukan_s: `[${ketukan_s.length}]` }));
process.exit(rc);
