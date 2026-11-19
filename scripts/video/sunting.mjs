#!/usr/bin/env node
// Video demo edit (P8a/P8, PH§7.2): cuts each storyboard scene from the recording, adds the end card, burns EN captions,
// writes the .srt, mixes narration + tap clicks, normalises loudness (two-pass loudnorm) and measures the result.
// Values: config/video.json. Scenes and narration: the video script table (docs/hantar/SKRIP-VIDEO.md, local file).
//
// Guna: node scripts/video/sunting.mjs --peta <peta.json> --keluar <folder> [--skrip SKRIP-VIDEO.md]
//         [--narasi <audio>] [--nilai <slot.json>] [--pemegang-tempat]
//   peta.json  = { "sumber": {nama: laluan}, "babak": [{"sumber": nama, "mula": s} | {"kad": true}, …],
//                  "ketukan"?: {"fixture": laluan, "sumber": nama, "sumber_mula_us": µs} }  (laluan relatif kepada peta.json)
//   slot.json  = {"bpm rehat": "71", …} mengisi <<TBD …>>. Slot kosong = keluar 3, kecuali --pemegang-tempat.
//   --pemegang-tempat: keluaran WAJIB dalam folder_rahsia, nama berawalan awalan_pemegang_tempat; narasi tiruan bila --narasi tiada.
// Keluar: 0 lulus · 2 argumen/peta · 3 slot TBD · 4 ukuran di luar had · 5 ffmpeg gagal.
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, isAbsolute, join, resolve, sep } from "node:path";
import { parseArgs } from "node:util";
import { AKAR, muatTs } from "../muat-ts.mjs";

const { values: o } = parseArgs({
  options: {
    peta: { type: "string" },
    keluar: { type: "string" },
    skrip: { type: "string", default: join(AKAR, "docs/hantar/SKRIP-VIDEO.md") },
    narasi: { type: "string" },
    nilai: { type: "string" },
    "pemegang-tempat": { type: "boolean", default: false },
  },
});
const henti = (kod, mesej) => {
  console.error(mesej);
  process.exit(kod);
};
if (!o.peta || !o.keluar) henti(2, "guna: --peta <peta.json> --keluar <folder> (lihat kepala fail)");

const V = await muatTs("src/alat/video.ts");
const K = JSON.parse(readFileSync(join(AKAR, "config/video.json"), "utf8"));
const rumah = (p) => (p.startsWith("~/") ? join(homedir(), p.slice(2)) : p);
const pt = o["pemegang-tempat"];

const keluar = resolve(o.keluar);
mkdirSync(keluar, { recursive: true, mode: 0o700 });
if (pt) {
  const rahsia = realpathSync(rumah(K.folder_rahsia));
  if (!(realpathSync(keluar) + sep).startsWith(rahsia + sep)) henti(2, `pemegang tempat hanya dalam ${K.folder_rahsia}`);
}
const awalan = pt ? K.awalan_pemegang_tempat : "";
const fail = (n) => join(keluar, awalan + n);

// 1. Babak + slot.
let babak = V.huraiBabak(readFileSync(o.skrip, "utf8"), K.jadual);
babak = V.isiSlot(babak, o.nilai ? JSON.parse(readFileSync(o.nilai, "utf8")) : {}, pt ? (n) => `[${n}]` : undefined);
const baki = V.slotTbd(babak);
if (baki.length) henti(3, `slot TBD belum diisi: ${baki.join(", ")}`);
const tempoh = babak.at(-1).akhir;

// 2. Peta potong.
const peta = JSON.parse(readFileSync(o.peta, "utf8"));
const asasPeta = dirname(resolve(o.peta));
const laluan = (p) => (isAbsolute(p) ? p : join(asasPeta, p));
const ralatPeta = V.semakPeta(babak, peta);
for (const p of Object.values(peta.sumber)) if (!existsSync(laluan(p))) ralatPeta.push(`sumber tiada: ${p}`);
if (ralatPeta.length) henti(2, ralatPeta.join("\n"));

const ff = (args, label) => {
  const r = spawnSync("ffmpeg", ["-hide_banner", "-nostdin", "-y", ...args], { encoding: "utf8", maxBuffer: 64 << 20 });
  if (r.status !== 0) henti(5, `${label}: ffmpeg rc ${r.status}\n${(r.stderr ?? "").split("\n").slice(-12).join("\n")}`);
  return r.stderr ?? "";
};
const probeTempoh = (f) =>
  Number(spawnSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f], { encoding: "utf8" }).stdout.trim());

const css = readFileSync(join(AKAR, K.keluaran.fail_gaya), "utf8");
const warna = (t) => V.tokenWarna(css, t);
const { lebar: W, tinggi: H, fps, crf, preset } = K.keluaran;
const kerja = join(keluar, `${awalan}kerja`);
rmSync(kerja, { recursive: true, force: true });
mkdirSync(kerja, { mode: 0o700 });
const kod = ["-c:v", "libx264", "-preset", preset, "-crf", String(crf), "-pix_fmt", "yuv420p", "-r", String(fps)];
// Segmen perantaraan: hampir tanpa rugi dan pantas; hanya laluan akhir memakai preset/crf keluaran.
const kodAntara = ["-c:v", "libx264", "-preset", K.keluaran.preset_antara, "-crf", String(K.keluaran.crf_antara), "-pix_fmt", "yuv420p", "-r", String(fps)];
// Rakaman app dikecilkan ke atas jalur kapsyen di bawah supaya kapsyen tidak menutup butang UI.
const HR = H - K.keluaran.jalur_kapsyen_px;

// 3. Setiap babak → segmen 1080p tanpa audio (kad akhir dijana dari token warna app).
const sudut = (f) => f.replace(/\\/g, "\\\\").replace(/:/g, "\\:").replace(/'/g, "\\'");
const ruang = (s) => s.replace(/\\/g, "\\\\").replace(/'/g, "\u2019").replace(/:/g, "\\:").replace(/%/g, "\\%");
// Setiap sumber dinormalkan SEKALI (30 fps tetap, 1080p, jalur kapsyen): perakam app = webm kadar bingkai berubah tanpa indeks,
// jadi cari di input tidak tepat dan cari di output menyahkod dari awal untuk setiap babak.
const sudahNormal = {};
const normal = (nama) =>
  (sudahNormal[nama] ??= (() => {
    const out = join(kerja, `sumber-${Object.keys(sudahNormal).length + 1}.mp4`);
    const vf = `fps=${fps},scale=${W}:${HR}:force_original_aspect_ratio=decrease,pad=${W}:${H}:(ow-iw)/2:(${HR}-ih)/2:color=${warna(K.keluaran.token_latar)},setsar=1`;
    ff(["-i", laluan(peta.sumber[nama]), "-an", "-vf", vf, ...kodAntara, "-g", String(fps), out], `normal ${nama}`);
    return out;
  })());
const segmen = babak.map((b, i) => {
  const d = b.akhir - b.mula;
  const out = join(kerja, `babak-${String(i + 1).padStart(2, "0")}.mp4`);
  const p = peta.babak[i];
  if ("kad" in p) {
    const k = K.kad_akhir;
    const tinggi = k.saiz.reduce((s, x) => s + x, 0) + k.jarak * (k.saiz.length - 1);
    let y = Math.round((H - tinggi) / 2);
    const teks = k.baris.map((t, j) => {
      const f = sudut(join(AKAR, j === 0 ? k.fon_tebal : k.fon_fail));
      const c = j === 0 ? warna(K.keluaran.token_aksen) : warna(K.keluaran.token_teks);
      const s = `drawtext=fontfile='${f}':text='${ruang(t)}':fontsize=${k.saiz[j]}:fontcolor=${c}:x=(w-text_w)/2:y=${y}`;
      y += k.saiz[j] + k.jarak;
      return s;
    });
    ff(["-f", "lavfi", "-i", `color=c=${warna(K.keluaran.token_latar)}:s=${W}x${H}:r=${fps}:d=${d}`, "-vf", teks.join(","), ...kodAntara, out], `kad akhir`);
  } else {
    ff(["-ss", String(p.mula), "-i", normal(p.sumber), "-t", String(d), ...kodAntara, out], `babak ${i + 1}`);
  }
  const t = probeTempoh(out);
  if (Math.abs(t - d) > K.had.toleransi_babak_s) henti(2, `babak ${i + 1}: segmen ${t.toFixed(2)} s, jangka ${d} s (sumber terlalu pendek dari mula ${"kad" in p ? "-" : p.mula} s?)`);
  return out;
});
const senarai = join(kerja, "senarai.txt");
writeFileSync(senarai, segmen.map((s) => `file '${s}'`).join("\n") + "\n");
const bisu = join(kerja, "bisu.mp4");
ff(["-f", "concat", "-safe", "0", "-i", senarai, "-c", "copy", bisu], "cantum");

// 4. Kapsyen EN (.srt di sebelah video + dibakar sebagai pil kecil).
const kapsyen = V.jadualKapsyen(babak, K.kapsyen);
const srtFail = fail("degup-demo.srt");
writeFileSync(srtFail, V.srt(kapsyen));

// 5. Audio: narasi (atau tiruan bila pemegang tempat) + klik ketukan → loudnorm dua laluan.
const kadar = K.keluaran.kadar_sampel;
const klik = peta.ketukan
  ? V.petaKetukan(babak, peta, JSON.parse(readFileSync(laluan(peta.ketukan.fixture), "utf8")).ketukan)
  : [];
const lapis = V.bunyiKetukan(klik, tempoh, kadar, K.ketukan);
if (!o.narasi) {
  if (!pt) henti(2, "--narasi wajib kecuali --pemegang-tempat");
  const n = V.narasiTiruan(kapsyen, tempoh, kadar, K.narasi_tiruan);
  for (let i = 0; i < lapis.length; i++) lapis[i] += n[i];
}
const ketukWav = join(kerja, "lapis.wav");
writeFileSync(ketukWav, V.wav(lapis, kadar));
const masukAudio = o.narasi ? ["-i", resolve(o.narasi), "-i", ketukWav] : ["-i", ketukWav];
const campur = o.narasi
  ? `[0:a]aresample=${kadar},apad,atrim=0:${tempoh}[n];[1:a]aresample=${kadar}[k];[n][k]amix=inputs=2:normalize=0:duration=first`
  : `[0:a]aresample=${kadar},atrim=0:${tempoh}`;
const { sasaran_lufs: I, sasaran_tp: TP, lra: LRA } = K.loudnorm;
const m = V.huraiLoudnorm(ff([...masukAudio, "-filter_complex", `${campur},loudnorm=I=${I}:TP=${TP}:LRA=${LRA}:print_format=json`, "-f", "null", "-"], "loudnorm 1"));
const audio = join(kerja, "audio.wav");
const ln = `loudnorm=I=${I}:TP=${TP}:LRA=${LRA}:measured_I=${m.input_i}:measured_TP=${m.input_tp}:measured_LRA=${m.input_lra}:measured_thresh=${m.input_thresh}:offset=${m.target_offset}:linear=true`;
ff([...masukAudio, "-filter_complex", `${campur},${ln},aresample=${kadar}`, "-ac", "2", audio], "loudnorm 2");

// 6. Akhir: video + kapsyen dibakar + audio.
const kp = K.kapsyen;
const abgr = (hex, legap) => `&H${Math.round((1 - legap) * 255).toString(16).padStart(2, "0").toUpperCase()}${hex.slice(5, 7)}${hex.slice(3, 5)}${hex.slice(1, 3)}`.toUpperCase();
const gaya = [
  `FontName=${kp.fon}`,
  `FontSize=${kp.saiz}`,
  `PrimaryColour=${abgr(warna(K.keluaran.token_teks), 1)}`,
  `BackColour=${abgr(warna(K.keluaran.token_latar), kp.legap_latar)}`,
  `OutlineColour=${abgr(warna(K.keluaran.token_latar), kp.legap_latar)}`,
  "BorderStyle=3",
  `Outline=${kp.pinggir}`,
  "Shadow=0",
  `MarginV=${kp.jidar_bawah}`,
].join(",");
const mp4 = fail("degup-demo.mp4");
ff(
  ["-i", bisu, "-i", audio, "-vf", `subtitles='${sudut(srtFail)}':fontsdir='${sudut(join(AKAR, kp.folder_fon))}':force_style='${gaya}'`,
    ...kod, "-c:a", "aac", "-b:a", `${K.keluaran.audio_kbps}k`, "-shortest", "-movflags", "+faststart", mp4],
  "akhir",
);
rmSync(kerja, { recursive: true, force: true });

// 7. Ukur.
const u = V.huraiEbur128(ff(["-i", mp4, "-map", "0:a", "-af", "ebur128=peak=true", "-f", "null", "-"], "ukur"));
const ukuran = { tempoh: probeTempoh(mp4), lufs: u.lufs, tp: u.tp, babak: babak.length, kapsyen: kapsyen.length, ketukan: klik.length, pemegang_tempat: pt };
writeFileSync(fail("ukuran.json"), JSON.stringify(ukuran, null, 2) + "\n");
const gagal = V.semakUkuran(ukuran, K.had);
console.log(JSON.stringify({ ...ukuran, lulus: !gagal.length, gagal }));
process.exit(gagal.length ? 4 : 0);
