// Proses main Degup (PRD §4.11, corak electron-quickstart): tetingkap, kebenaran kamera, safeStorage, fail tempatan.
// Renderer memiliki kamera; main tidak pernah melihat bingkai video (SDK main menerimanya melalui jambatan rasmi bila live).
import { app, BrowserWindow, ipcMain, safeStorage, screen, session, shell } from "electron";
import { readdirSync, readFileSync } from "node:fs";
import { arch, platform, release } from "node:os";
import { join } from "node:path";
import konfig from "../../config/app.json";
import { sahkanDiag, saizRakam } from "../core/diagnostik.js";
import { sahkanFixture } from "../core/fixture.js";
import { SALURAN, type FixtureSedia, type Permulaan, type Tetapan } from "../preload/api.js";
import { simpanKad } from "./kad.js";
import { bacaKomitKit, LogDiagnostik } from "./log.js";
import { PenulisRakaman, simpanFixtureRakaman } from "./rakaman.js";
import { PengikatSdk, sediaPersekitaran, wujudFail } from "./sdk.js";
import { Simpanan, pilihBahasa, tetapanLalai, type Penyulit } from "./simpanan.js";

const AKAR = join(__dirname, "..");
const folderData = process.env.DEGUP_DATA;
if (folderData) {
  app.setPath("userData", folderData);
  // Mudah alih/ujian: kad PNG juga di bawah folder data, bukan Gambar pengguna (D12).
  app.setPath("pictures", join(folderData, "gambar"));
  app.setPath("videos", join(folderData, "video"));
  app.setPath("documents", join(folderData, "dokumen"));
}
const folderKad = () => join(app.getPath("pictures"), konfig.kad.folder);
const folderVideo = () => join(app.getPath("videos"), konfig.perakam.folder);
const folderFixture = () => join(app.getPath("documents"), konfig.fixture_rakaman.folder, konfig.fixture_rakaman.subfolder);
const perakam = new PenulisRakaman(folderVideo, konfig.perakam.awalan_fail, konfig.perakam);

const penyulit: Penyulit = {
  boleh: () => safeStorage.isEncryptionAvailable(),
  sulit: (t) => safeStorage.encryptString(t),
  buka: (b) => safeStorage.decryptString(b),
};

function fixtureSedia(): FixtureSedia[] {
  const folder = join(AKAR, "fixtures");
  const hasil: FixtureSedia[] = [];
  let fail: string[] = [];
  try {
    fail = readdirSync(folder).filter((f) => f.endsWith(".json"));
  } catch {
    return hasil;
  }
  for (const f of fail.sort()) {
    try {
      const sah = sahkanFixture(JSON.parse(readFileSync(join(folder, f), "utf8")), konfig.replay.skema);
      if (sah.ok) hasil.push({ fail: f, label: sah.fixture.meta.label, jenis: sah.fixture.meta.jenis, tarikh: sah.fixture.meta.tarikh });
    } catch {
      /* fail rosak dilangkau; pengesah sudah diuji */
    }
  }
  return hasil;
}

/** Skala masa ujian: hanya untuk sumber sim/replay (Playwright, D12), tidak pernah untuk live. */
function skalaMasa(): number {
  const sumber = process.env[konfig.sumber_env];
  if (sumber !== "sim" && sumber !== "replay") return 1;
  const x = Number(process.env[konfig.uji.skala_masa_env]);
  return x > 0 && x <= 1 ? x : 1;
}

/** Baca fixture ikut nama yang disenaraikan sahaja (tiada laluan dari renderer). */
function bacaFixture(fail: unknown): unknown {
  if (typeof fail !== "string" || !fixtureSedia().some((f) => f.fail === fail)) return null;
  try {
    const sah = sahkanFixture(JSON.parse(readFileSync(join(AKAR, "fixtures", fail), "utf8")), konfig.replay.skema);
    return sah.ok ? sah.fixture : null;
  } catch {
    return null;
  }
}

/** Kunci untuk SDK: simpanan safeStorage; app tidak dipakej (pembangunan) boleh memakai env SMARTSPECTRA_API_KEY. */
function kunciLive(simpanan: Simpanan): string | null {
  const k = simpanan.bacaKunci();
  if (k) return k;
  return app.isPackaged ? null : (process.env.SMARTSPECTRA_API_KEY?.trim() || null);
}

/** Log diagnostik kit (J6a): kunci tersimpan + env ditapis dari setiap baris. */
function bukaLog(simpanan: Simpanan): LogDiagnostik {
  return new LogDiagnostik(
    () => app.getPath("userData"),
    konfig.log,
    () => ({
      versi: app.getVersion(),
      komit_kit: bacaKomitKit(join(AKAR, konfig.kit.fail_komit)),
      os: platform(),
      os_versi: release(),
      arch: arch(),
      electron: process.versions.electron ?? "",
      sumber: process.env[konfig.sumber_env] ?? "tetapan",
    }),
    () => [simpanan.bacaKunci(), process.env.SMARTSPECTRA_API_KEY],
  );
}

/** Tetingkap rakaman 16:9 (PH§7.1): saiz kandungan sasaran, dikecilkan jika skrin lebih kecil. */
function aturTetingkapRakam(win: BrowserWindow, log: LogDiagnostik): void {
  const t = konfig.tetingkap;
  if (win.isFullScreen()) win.setFullScreen(false);
  if (win.isMaximized()) win.unmaximize();
  const [lw, lt] = win.getSize();
  const [kw, kt] = win.getContentSize();
  const kawasan = screen.getDisplayMatching(win.getBounds()).workArea;
  const saiz = saizRakam(
    t.rakam,
    { lebar: kawasan.width - (lw! - kw!), tinggi: kawasan.height - (lt! - kt!) },
    { lebar: t.min_lebar, tinggi: t.min_tinggi },
  );
  win.setContentSize(saiz.lebar, saiz.tinggi);
  win.center();
  log.tulis({ jenis: "tetingkap", ...saiz });
}

function daftarIpc(simpanan: Simpanan, log: LogDiagnostik, tetingkap: () => BrowserWindow | null): void {
  const pengikat = new PengikatSdk<BrowserWindow>(
    // Dimuat malas: pakej SDK memuat pustaka asli semasa require (sim/replay tidak pernah sampai di sini).
    () => require("@smartspectra/node-sdk/main") as { bindSmartSpectraIpc(w: BrowserWindow): void },
    () => kunciLive(simpanan),
    () =>
      void sediaPersekitaran(process.env, {
        dipakej: app.isPackaged,
        resources: process.resourcesPath,
        pakej: konfig.sdk.pakej,
        platform: process.platform,
        arch: process.arch,
        vulkanIcdLinux: konfig.sdk.vulkan_icd_linux,
        wujud: wujudFail,
      }),
  );
  ipcMain.handle(SALURAN.sediaLive, (e) => {
    const win = tetingkap();
    if (!win || e.sender !== win.webContents) return { ok: false, sebab: "sdk" };
    const h = pengikat.sedia(win);
    log.tulis({ jenis: "sdk_sedia", ok: h.ok, sebab: h.ok ? null : h.sebab });
    return h;
  });
  // Log diagnostik: hanya bentuk peristiwa yang dibenarkan (`sahkanDiag`), hanya dari tetingkap Degup.
  ipcMain.on(SALURAN.diag, (e, p: unknown) => {
    const win = tetingkap();
    const sah = win && e.sender === win.webContents ? sahkanDiag(p, konfig.log.teks_maks) : null;
    if (sah) log.tulis(sah);
  });
  // Sumber tangkapan = ID media tetingkap Degup sendiri (format desktopCapturer); renderer tidak boleh memilih skrin/tetingkap lain.
  ipcMain.handle(SALURAN.rakamMula, (e) => {
    const win = tetingkap();
    if (!win || e.sender !== win.webContents) return { ok: false };
    aturTetingkapRakam(win, log);
    const h = perakam.mula(new Date());
    return h.ok ? { ok: true, nama: h.nama, sumber: win.getMediaSourceId() } : { ok: false };
  });
  ipcMain.handle(SALURAN.rakamTulis, (_e, bait: unknown) => perakam.tulis(bait));
  ipcMain.handle(SALURAN.rakamTamat, () => {
    const h = perakam.tamat();
    if (!h.ok) return { ok: false };
    simpanan.catat(h.laluan);
    return { ok: true, nama: h.nama };
  });
  ipcMain.handle(SALURAN.simpanFixture, (_e, data: unknown) => {
    if (!konfig.rakam_fixture) return { ok: false };
    const h = simpanFixtureRakaman(folderFixture(), konfig.fixture_rakaman.awalan_fail, data, konfig.replay.skema, new Date());
    if (!h.ok) return { ok: false };
    simpanan.catat(h.laluan);
    return { ok: true, nama: h.nama };
  });
  const pautan = konfig.pautan as Record<string, string>;
  ipcMain.handle(SALURAN.mula, (): Permulaan => ({
    tetapan: simpanan.bacaTetapan(),
    versi: app.getVersion(),
    sumberEnv: process.env[konfig.sumber_env] ?? null,
    fixtures: fixtureSedia(),
    skalaMasa: skalaMasa(),
    kunciAda: simpanan.kunciAda(),
    failDitulis: simpanan.failDitulis(),
  }));
  ipcMain.handle(SALURAN.simpanTetapan, (_e, ubah: Partial<Tetapan>) => simpanan.simpanTetapan(ubah ?? {}));
  ipcMain.handle(SALURAN.simpanKunci, (_e, kunci: unknown) => simpanan.simpanKunci(typeof kunci === "string" ? kunci : ""));
  ipcMain.handle(SALURAN.padamKunci, () => simpanan.padamKunci());
  ipcMain.handle(SALURAN.padamSemua, () => simpanan.padamSemua());
  ipcMain.handle(SALURAN.failDitulis, () => simpanan.failDitulis());
  ipcMain.handle(SALURAN.bacaFixture, (_e, fail: unknown) => bacaFixture(fail));
  ipcMain.handle(SALURAN.simpanKad, (_e, png: unknown) => {
    const h = simpanKad(folderKad(), konfig.kad.awalan_fail, png, konfig.kad.maks_bait, new Date());
    if (!h.ok) return { ok: false };
    simpanan.catat(h.laluan);
    return { ok: true, nama: h.nama };
  });
  ipcMain.handle(SALURAN.bukaFolderKad, async () => {
    await shell.openPath(folderKad());
  });
  // Hanya pautan bernama dalam config.pautan, hanya https: renderer tidak boleh membuka URL sewenang-wenang.
  ipcMain.handle(SALURAN.bukaPautan, async (_e, id: unknown) => {
    const url = typeof id === "string" ? pautan[id] : undefined;
    if (url && url.startsWith("https://")) await shell.openExternal(url);
  });
}

function cipta(): BrowserWindow {
  const t = konfig.tetingkap;
  const rakam = process.env[t.env] === t.nilai_rakam;
  const win = new BrowserWindow({
    width: rakam ? t.rakam.lebar : t.lebar,
    height: rakam ? t.rakam.tinggi : t.tinggi,
    useContentSize: rakam,
    minWidth: t.min_lebar,
    minHeight: t.min_tinggi,
    backgroundColor: "#0f1626",
    title: "Degup",
    show: false,
    webPreferences: {
      preload: join(__dirname, "preload.cjs"),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
    },
  });
  // Video sahaja, sahaja untuk tetingkap ini: kamera ("media") dan perakam demo ("display-capture"; main memberi ID tetingkap
  // sendiri sahaja). Bukan mikrofon.
  const bolehKamera = (wc: Electron.WebContents | null, izin: string, jenis?: string[]) =>
    wc === win.webContents && (izin === "media" || izin === "display-capture") && (jenis ?? ["video"]).every((m) => m === "video");
  session.defaultSession.setPermissionRequestHandler((wc, izin, cb, butiran) =>
    cb(bolehKamera(wc, izin, "mediaTypes" in butiran ? (butiran.mediaTypes as string[] | undefined) : undefined)),
  );
  session.defaultSession.setPermissionCheckHandler((wc, izin) => bolehKamera(wc, izin));
  win.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  win.webContents.on("will-navigate", (e) => e.preventDefault());
  win.removeMenu();
  win.once("ready-to-show", () => win.show());
  void win.loadFile(join(__dirname, "renderer", "index.html"));
  win.on("closed", () => void perakam.tamat());
  return win;
}

void app.whenReady().then(() => {
  // Ujian sahaja (xvfb tiada keyring): benarkan backend basic_text Linux. App sebenar tanpa keyring menolak menyimpan kunci.
  if (process.env.DEGUP_UJI_STORAN_ASAS === "1" && process.platform === "linux") safeStorage.setUsePlainTextEncryption(true);
  const bahasa = pilihBahasa(konfig.bahasa_lalai, app.getLocale(), konfig.bahasa, konfig.bahasa_undur);
  const lalai = tetapanLalai(bahasa, konfig.rasa.bunyi_lalai);
  let win: BrowserWindow | null = null;
  const simpanan = new Simpanan(app.getPath("userData"), lalai, konfig.bahasa, penyulit);
  const log = bukaLog(simpanan);
  daftarIpc(simpanan, log, () => win);
  win = cipta();
  const [lebar, tinggi] = win.getContentSize();
  log.tulis({ jenis: "tetingkap", lebar: lebar!, tinggi: tinggi! });
});
app.on("window-all-closed", () => app.quit());
