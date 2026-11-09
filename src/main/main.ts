// Proses main Degup (PRD §4.11, corak electron-quickstart): tetingkap, kebenaran kamera, safeStorage, fail tempatan.
// Renderer memiliki kamera; main tidak pernah melihat bingkai video.
import { app, BrowserWindow, ipcMain, safeStorage, session, shell } from "electron";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import konfig from "../../config/app.json";
import { sahkanFixture } from "../core/fixture.js";
import { SALURAN, type FixtureSedia, type Permulaan, type Tetapan } from "../preload/api.js";
import { Simpanan, tetapanLalai, type Penyulit } from "./simpanan.js";

const AKAR = join(__dirname, "..");
const folderData = process.env.DEGUP_DATA;
if (folderData) app.setPath("userData", folderData);

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

/** Skala masa ujian: hanya untuk sumber sim (Playwright), tidak pernah untuk live/replay. */
function skalaMasa(): number {
  if (process.env[konfig.sumber_env] !== "sim") return 1;
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

function daftarIpc(simpanan: Simpanan): void {
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
  // Hanya pautan bernama dalam config.pautan, hanya https: renderer tidak boleh membuka URL sewenang-wenang.
  ipcMain.handle(SALURAN.bukaPautan, async (_e, id: unknown) => {
    const url = typeof id === "string" ? pautan[id] : undefined;
    if (url && url.startsWith("https://")) await shell.openExternal(url);
  });
}

function cipta(): void {
  const t = konfig.tetingkap;
  const win = new BrowserWindow({
    width: t.lebar,
    height: t.tinggi,
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
  // Kamera sahaja (bukan mikrofon), sahaja untuk tetingkap ini.
  const bolehKamera = (wc: Electron.WebContents | null, izin: string, jenis?: string[]) =>
    wc === win.webContents && izin === "media" && (jenis ?? ["video"]).every((m) => m === "video");
  session.defaultSession.setPermissionRequestHandler((wc, izin, cb, butiran) =>
    cb(bolehKamera(wc, izin, "mediaTypes" in butiran ? (butiran.mediaTypes as string[] | undefined) : undefined)),
  );
  session.defaultSession.setPermissionCheckHandler((wc, izin) => bolehKamera(wc, izin));
  win.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  win.webContents.on("will-navigate", (e) => e.preventDefault());
  win.removeMenu();
  win.once("ready-to-show", () => win.show());
  void win.loadFile(join(__dirname, "renderer", "index.html"));
}

void app.whenReady().then(() => {
  // Ujian sahaja (xvfb tiada keyring): benarkan backend basic_text Linux. App sebenar tanpa keyring menolak menyimpan kunci.
  if (process.env.DEGUP_UJI_STORAN_ASAS === "1" && process.platform === "linux") safeStorage.setUsePlainTextEncryption(true);
  const lalai = tetapanLalai(konfig.bahasa_lalai, konfig.sejarah_lalai, konfig.rasa.bunyi_lalai);
  daftarIpc(new Simpanan(app.getPath("userData"), lalai, konfig.bahasa, penyulit));
  cipta();
});
app.on("window-all-closed", () => app.quit());
