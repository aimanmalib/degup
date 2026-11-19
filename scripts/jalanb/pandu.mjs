#!/usr/bin/env node
// Pemandu jalan B (PH§5.5 K3 b, PH§5.4 N6, PH§7.3A): app SEBENAR dengan fail video sebagai kamera (kamera palsu Chromium, MJPEG
// kecil), babak diselaras dengan tiga bahagian video (diam → ketuk → nafas), ketukan dari trek audio dimainkan ke skrin RASA pada
// saat ia dibuat, dan perakam app (Rakam demo) merakam tetingkap. Masa diukur dari bingkai pertama kamera: requestVideoFrameCallback
// pada pratonton app (captureTime − mediaTime). Sumber sim (raptai) tiada kamera: sauh = skrin LIHAT muncul.
// Nilai = config/jalanb.json (+ aliran.rasa_s dari config/app.json). Video, rakaman dan log kekal dalam folder rahsia.
//
// Guna (hos, selepas `node esbuild.config.mjs`), melalui ujian-pelayar.sh + xvfb-run (skrin 1920×1080):
//   node scripts/jalanb/pandu.mjs --video <dalam rahsia> --ketukan <ketukan-dari-audio.json> [--sumber live|sim]
//        [--folder <dalam rahsia>] [--bahasa en] [--sehingga lihat] [--kamera-sahaja]
//   --sehingga lihat: berhenti selepas sauh + skrin LIHAT (asap laluan kamera, masa SDK minimum).
// Keluar: 0 = semua babak + ketukan dalam had (+ live: tiada label Simulation) · 1 = semakan gagal · 2 = guna salah / prasyarat.
import { _electron as electron } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync, realpathSync, renameSync, rmSync, statSync, statfsSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join, resolve, sep } from "node:path";
import { parseArgs } from "node:util";
import { AKAR, muatTs } from "../muat-ts.mjs";

const { values: o } = parseArgs({
  options: {
    video: { type: "string" },
    ketukan: { type: "string" },
    sumber: { type: "string", default: "live" },
    folder: { type: "string" },
    bahasa: { type: "string", default: "en" },
    sehingga: { type: "string" },
    "kamera-sahaja": { type: "boolean" },
  },
});
const J = JSON.parse(readFileSync(join(AKAR, "config/jalanb.json"), "utf8"));
const APP = JSON.parse(readFileSync(join(AKAR, "config/app.json"), "utf8"));
const lang = JSON.parse(readFileSync(join(AKAR, `lang/${o.bahasa}.json`), "utf8"));
const rahsia = realpathSync(J.folder_rahsia.replace(/^~\//, homedir() + "/"));
const dalamRahsia = (f) => (realpathSync(f) + sep).startsWith(rahsia + sep);
const henti = (rc, m) => {
  console.error(m);
  process.exit(rc);
};
if (!o.video || !o.ketukan || !["live", "sim"].includes(o.sumber)) henti(2, "guna: pandu.mjs --video <f> --ketukan <f.json> [--sumber live|sim]");
if (!existsSync(o.video) || !dalamRahsia(o.video)) henti(2, `video mesti wujud dalam ${J.folder_rahsia}`);
if (!existsSync(join(AKAR, "dist/main.cjs"))) henti(2, "dist/ tiada: jalankan node esbuild.config.mjs dahulu");
const folder = resolve(o.folder ?? join(rahsia, `jalanb-${o.sumber}`));
mkdirSync(folder, { recursive: true, mode: 0o700 });
if (!dalamRahsia(folder)) henti(2, `folder mesti dalam ${J.folder_rahsia}`);
const kosongGb = (() => {
  const s = statfsSync(folder);
  return (s.bavail * s.bsize) / 1e9;
})();
if (kosongGb < J.kamera.cakera_min_gb) henti(2, `cakera kosong ${kosongGb.toFixed(1)} GB < ${J.kamera.cakera_min_gb} GB`);

const { argMjpeg, rancangKetukan } = await muatTs("src/alat/jalanb.ts");
const ketukanVideo = JSON.parse(readFileSync(o.ketukan, "utf8")).ketukan_s;
const B = J.babak;

// 1. Fail kamera palsu (MJPEG, tiada audio). Disimpan semula dalam folder rahsia: penukaran 3 minit lambat di hos sibuk, jadi
// larian ulang memakai fail yang sama bila ia lebih baharu daripada video (`--kamera-sahaja` = tukar sahaja, tanpa slot pelayar).
const mjpeg = join(folder, "kamera.mjpeg");
if (!existsSync(mjpeg) || statSync(mjpeg).mtimeMs < statSync(o.video).mtimeMs) {
  execFileSync("ffmpeg", argMjpeg(o.video, mjpeg + ".sementara", J.kamera));
  renameSync(mjpeg + ".sementara", mjpeg);
}
if (o["kamera-sahaja"]) henti(0, `kamera: ${mjpeg}`);

// 2. Lancar app.
const data = join(folder, "data");
rmSync(data, { recursive: true, force: true });
const env = {};
for (const [k, v] of Object.entries(process.env)) if (v !== undefined) env[k] = v;
Object.assign(env, { [APP.sumber_env]: o.sumber, DEGUP_DATA: data, DEGUP_UJI_STORAN_ASAS: "1", DEGUP_TETINGKAP: "rakam" });
let kunci = null;
if (o.sumber === "live") {
  const { kunciDariEnv } = await muatTs("src/alat/asap-p1.ts");
  const fe = join(AKAR, ".env");
  kunci = kunciDariEnv(existsSync(fe) ? readFileSync(fe, "utf8") : null, process.env);
  if (!kunci) henti(2, "SMARTSPECTRA_API_KEY tiada (env atau .env repo)");
  env.SMARTSPECTRA_API_KEY = kunci;
} else delete env.SMARTSPECTRA_API_KEY;
const bersih = (s) => (kunci ? String(s).split(kunci).join("<kunci>") : String(s)).slice(0, 300);

const hasil = { sumber: o.sumber, babak_video_s: {}, lencana: [], konsol: [], semakan: {} };
const semak = (n, lulus, nota) => (hasil.semakan[n] = nota === undefined ? { lulus } : { lulus, nota });
let app;
let rc = 1;
const pengawal = setTimeout(() => {
  console.error("tamat masa: had_larian_s");
  app?.close().finally(() => process.exit(1));
}, B.had_larian_s * 1000);

try {
  app = await electron.launch({
    cwd: AKAR,
    env,
    args: ["--no-sandbox", "--password-store=basic", `--lang=${o.bahasa}`, "--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream",
      `--use-file-for-fake-video-capture=${mjpeg}`, "."],
  });
  const win = await app.firstWindow();
  win.on("console", (m) => m.type() === "error" && hasil.konsol.push(bersih(m.text())));
  win.on("pageerror", (e) => hasil.konsol.push(bersih(e.message)));
  await win.waitForSelector("[data-uji=senarai-izin]");
  const cdp = await app.context().newCDPSession(win);

  // Instrumen pemandu (bukan kod app): cap masa ketukan seperti app (timeOrigin + e.timeStamp) dan sauh bingkai pertama kamera.
  await win.evaluate(() => {
    const w = window;
    const kini = () => performance.timeOrigin + performance.now();
    w.__jalanb = { ketukan: [], gum: null, rasa: null };
    // Saat pelita RASA masuk DOM (jam halaman) ≈ `mula` tetingkap RASA app: ketukan sebelum ini tidak dimainkan.
    new MutationObserver(() => {
      if (w.__jalanb.rasa === null && document.querySelector("[data-uji=rasa]")) w.__jalanb.rasa = kini();
    }).observe(document.body, { childList: true, subtree: true });
    document.addEventListener("pointerdown", (e) => w.__jalanb.ketukan.push(performance.timeOrigin + e.timeStamp), true);
    const md = navigator.mediaDevices;
    const asal = md.getUserMedia.bind(md);
    md.getUserMedia = async (c) => {
      const mula = kini();
      const st = await asal(c);
      w.__jalanb.gum = { mula, siap: kini() };
      return st;
    };
  });

  const skrin = () => win.locator("#pentas").getAttribute("data-skrin");
  const lencana = async () => {
    const t = (await win.locator("[data-uji=lencana-sumber]").first().textContent().catch(() => null)) ?? "";
    hasil.lencana.push({ skrin: await skrin(), teks: t });
  };
  const tidur = (ms) => new Promise((r) => setTimeout(r, Math.max(0, ms)));
  const sampai = async (nama, maksS) => {
    for (let i = 0; i < maksS * 20 && (await skrin()) !== nama; i++) await tidur(50);
    if ((await skrin()) !== nama) throw new Error(`skrin ${nama} tidak sampai (kini ${await skrin()})`);
    await lencana();
  };

  if (o.sehingga !== "lihat") {
    await win.locator("[data-uji=rakam-demo]").click();
    await win.locator("[data-uji=rakam-hidup]").waitFor();
  }
  await win.locator("[data-uji=umur]").check();
  await win.locator("[data-uji=hidupkan]").click();
  await sampai("lihat", B.tunggu_skrin_s + B.tunggu_bingkai_pertama_s);

  // Jam halaman (performance.timeOrigin + now, sama seperti cap ketukan app) boleh berbeza daripada jam dinding Date.now() (jam
  // monotonik lawan dinding). Ofset diukur DALAM halaman (dua jam dibaca bersebelahan; Date.now() renderer = jam dinding OS yang
  // sama dengan proses Node), bukan pergi-balik CDP yang boleh ratusan ms di hos sibuk. Median 9 bacaan.
  const ofsetHalaman = async () => {
    const d = await win.evaluate(() => {
      const x = [];
      for (let i = 0; i < 9; i++) {
        const a = Date.now();
        const h = performance.timeOrigin + performance.now();
        x.push(h - (a + Date.now()) / 2);
      }
      return x.sort((p, q) => p - q);
    });
    return { ofset: d[4], sebar: d[8] - d[0] };
  };
  const jam = await ofsetHalaman();
  hasil.jam_halaman = { ofset_ms: +jam.ofset.toFixed(1), sebar_ms: +jam.sebar.toFixed(1) };
  const kiniH = () => Date.now() + jam.ofset;

  // 3. Sauh t0 (ms epoch, jam halaman) = bingkai video 0.
  let t0;
  if (o.sumber === "live") {
    // rVFC pada pratonton app sendiri: mediaTime = saat sejak bingkai 0 strim, captureTime = masa tangkap bingkai itu (jam
    // halaman), jadi captureTime − mediaTime = bingkai 0 (diukur malar ±0.1 ms merentas bingkai, D33). Tiada captureTime =
    // min(now − mediaTime) atas beberapa bingkai.
    await win.waitForSelector("video.pratonton", { timeout: B.tunggu_bingkai_pertama_s * 1000 });
    const s = await win.evaluate(
      (n) =>
        new Promise((res) => {
          const v = document.querySelector("video.pratonton");
          const calon = [];
          const f = (now, m) => {
            calon.push(m.captureTime !== undefined ? m.captureTime - m.mediaTime * 1000 : now - m.mediaTime * 1000);
            if (calon.length < n) v.requestVideoFrameCallback(f);
            else res({ t: performance.timeOrigin + Math.min(...calon), sebar_ms: Math.max(...calon) - Math.min(...calon), tangkap: m.captureTime !== undefined });
          };
          v.requestVideoFrameCallback(f);
        }),
      8,
    );
    const gum = await win.evaluate(() => window.__jalanb.gum);
    t0 = s.t;
    hasil.sauh = { kaedah: s.tangkap ? "rvfc-captureTime" : "rvfc-now", sebar_ms: +s.sebar_ms.toFixed(1), gum_ms: Math.round(gum.siap - gum.mula),
      t0_tolak_gum_mula_ms: Math.round(t0 - gum.mula) };
    semak("sauh_dalam_gum", t0 >= gum.mula - 50 && t0 <= gum.siap + 50, hasil.sauh);
  } else {
    t0 = kiniH();
    hasil.sauh = { kaedah: "skrin-lihat (sim: tiada kamera)" };
  }
  const v = () => (kiniH() - t0) / 1000;
  const sehingga = (s) => tidur(t0 + s * 1000 - kiniH());
  hasil.babak_video_s.lihat = +v().toFixed(2);

  if (o.sehingga === "lihat") {
    await tidur(3000);
    await win.keyboard.press("Escape");
    await win.locator("[data-uji=senarai-izin]").waitFor({ timeout: 10_000 });
  } else {
    // 4. LIHAT tamat pada saat video lihat_tamat_s (butang Sedia mesti sudah hidup).
    // Sedia: kotak diambil awal, klik CDP tepat pada saat video lihat_tamat_s (klik locator = beberapa pergi-balik, lewat ~1 s).
    await tidur(t0 + B.lihat_tamat_s * 1000 - kiniH() - 3000);
    const sedia = win.locator("[data-uji=sedia]:not([disabled])");
    await sedia.waitFor({ timeout: (B.tunggu_sedia_maks_s + 3) * 1000 });
    const ks = await sedia.boundingBox();
    await sehingga(B.lihat_tamat_s);
    if (await sedia.count()) {
      const c = { x: Math.round(ks.x + ks.width / 2), y: Math.round(ks.y + ks.height / 2), button: "left", clickCount: 1 };
      await cdp.send("Input.dispatchMouseEvent", { type: "mousePressed", ...c });
      await cdp.send("Input.dispatchMouseEvent", { type: "mouseReleased", ...c });
    } else await win.locator("[data-uji=sedia]").click({ timeout: B.tunggu_sedia_maks_s * 1000 });
    const kotak = await win.locator("[data-uji=rasa]").boundingBox({ timeout: B.tunggu_skrin_s * 1000 });
    const rasaMula = ((await win.evaluate(() => window.__jalanb.rasa)) - t0) / 1000;
    await win.evaluate(() => (window.__jalanb.ketukan = [])); // buang klik butang sebelum RASA
    hasil.babak_video_s.rasa = +rasaMula.toFixed(2);
    const rasaTamat = rasaMula + APP.aliran.rasa_s;
    const r = rancangKetukan(ketukanVideo, rasaMula, rasaTamat);
    // Ketukan = input tetikus melalui saluran input Chromium (CDP Input.dispatchMouseEvent) dengan `timestamp` = saat ketukan
    // DIDENGAR dalam trek audio, jadi e.timeStamp app = masa ketukan pemilik. Tanpa medan itu, klik Playwright, jadual dalam
    // renderer dan webContents.sendInputEvent semuanya diukur lewat 40–170 ms di hos sibuk (renderer dicap semasa diproses; D33).
    // Lewat HANTAR (bukan lewat cap) dilapor berasingan; ketukan dihantar mengikut tertib dan dalam tetingkap RASA.
    // Hantar lewat tidak menggeser cap; ketukan yang hanya sempat dihantar selepas RASA tamat dikira tidak dimainkan.
    const dirancang = r.main.map((t) => t0 + t * 1000);
    const jamRasa = await ofsetHalaman(); // ukur semula: jam dinding boleh hanyut berbanding jam monotonik
    hasil.jam_halaman.ofset_rasa_ms = +jamRasa.ofset.toFixed(1);
    const x = Math.round(kotak.x + kotak.width / 2);
    const y = Math.round(kotak.y + kotak.height * 0.8);
    const lewatHantar = [];
    const dihantar = [];
    for (const tH of dirancang) {
      if (kiniH() >= t0 + rasaTamat * 1000 - 200) break;
      const tDinding = tH - jamRasa.ofset;
      await tidur(tDinding - Date.now());
      lewatHantar.push(Date.now() - tDinding);
      const ciri = { x, y, button: "left", clickCount: 1, timestamp: tDinding / 1000 };
      await cdp.send("Input.dispatchMouseEvent", { type: "mousePressed", ...ciri });
      await cdp.send("Input.dispatchMouseEvent", { type: "mouseReleased", ...ciri });
      dihantar.push(tH);
    }
    await tidur(300);
    const direkod = await win.evaluate(() => window.__jalanb.ketukan);
    await lencana();
    const ralat = direkod.map((x, i) => x - (dihantar[i] ?? NaN)).filter(Number.isFinite);
    hasil.ketukan = {
      dalam_fail: ketukanVideo.length,
      dijangka_dalam_rasa: r.main.length,
      sebelum_rasa: r.awal,
      selepas_rasa: r.lewat,
      dimainkan: dihantar.length,
      direkod_app: direkod.length,
      ralat_maks_ms: ralat.length ? +Math.max(...ralat.map(Math.abs)).toFixed(1) : null,
      lewat_hantar_maks_ms: lewatHantar.length ? +Math.max(...lewatHantar).toFixed(1) : null,
      ralat_median_ms: ralat.length ? +ralat.sort((a, b) => a - b)[Math.floor(ralat.length / 2)].toFixed(1) : null,
    };
    semak("ketukan_semua_dimainkan", dihantar.length === r.main.length && direkod.length === dihantar.length, hasil.ketukan);
    semak("ketukan_ralat", hasil.ketukan.ralat_maks_ms !== null && hasil.ketukan.ralat_maks_ms <= J.ketukan.ralat_maks_ms, hasil.ketukan.ralat_maks_ms);
    writeFileSync(join(folder, "ketukan.json"), JSON.stringify({ ketukan: direkod.map((x) => Math.round(x * 1000)) }) + "\n");

    // 5. DEDAH → LENTUR pada saat video ≥ lentur_mula_min_s → keputusan.
    await sampai("dedah", APP.aliran.rasa_s + B.tunggu_skrin_s);
    hasil.babak_video_s.dedah = +v().toFixed(2);
    await sehingga(B.lentur_mula_min_s);
    await win.locator("[data-uji=teruskan]").click();
    await sampai("lentur", B.tunggu_skrin_s);
    hasil.babak_video_s.lentur = +v().toFixed(2);
    semak("lentur_selepas_had", hasil.babak_video_s.lentur >= B.lentur_mula_min_s, hasil.babak_video_s.lentur);
    await win.locator("[data-uji=ke-keputusan]").click({ timeout: B.tunggu_keputusan_s * 1000 });
    await sampai("keputusan", B.tunggu_skrin_s);
    hasil.babak_video_s.keputusan = +v().toFixed(2);
    semak("keputusan_sebelum_video_tamat", hasil.babak_video_s.keputusan <= B.tamat_video_s, hasil.babak_video_s.keputusan);
  }
  await win.locator("[data-uji=rakam-hidup]").waitFor({ state: "detached", timeout: B.tunggu_rakaman_tamat_s * 1000 });

  const sim = lang.umum.simulasi;
  const adaSim = hasil.lencana.some((l) => l.teks.includes(sim));
  semak("label_simulation", o.sumber === "sim" ? adaSim : !adaSim, [...new Set(hasil.lencana.map((l) => l.teks))]);
  semak("tiada_ralat_konsol", hasil.konsol.length === 0, hasil.konsol.length);
} catch (e) {
  hasil.pengecualian = bersih(e?.message ?? e);
} finally {
  await app?.close().catch(() => {});
  clearTimeout(pengawal);
}

const vid = join(data, "video", "Degup");
const webm = existsSync(vid) ? readdirSync(vid).filter((f) => f.endsWith(".webm")) : [];
if (webm.length === 1) {
  const f = join(vid, webm[0]);
  // MediaRecorder webm tiada tempoh dalam pengepala: pts paket video terakhir.
  const pts = execFileSync("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_entries", "packet=pts_time", "-of", "csv=p=0", f], {
    encoding: "utf8",
    maxBuffer: 64 << 20,
  }).trim().split("\n");
  const tempoh = pts.at(-1);
  hasil.rakaman = { fail: webm[0], tempoh_s: Number.isFinite(Number(tempoh)) ? +Number(tempoh).toFixed(2) : null };
}
if (o.sehingga !== "lihat") semak("rakaman_wujud", webm.length === 1, webm.length);
rc = !hasil.pengecualian && Object.values(hasil.semakan).every((s) => s.lulus) ? 0 : 1;
hasil.rc = rc;
writeFileSync(join(folder, "hasil.json"), JSON.stringify(hasil, null, 2) + "\n");
console.log(JSON.stringify(hasil));
process.exit(rc);
