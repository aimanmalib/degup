// J8: Electron sebagai pelayar KOSONG untuk e2e/sim-web.spec.ts (pelari CI tiada pelayar Playwright dimuat turun).
// Tiada preload, tiada nodeIntegration, sandbox: halaman docs/sim/ berjalan seperti dalam Chromium biasa.
const { app, BrowserWindow, session } = require("electron");
const { join } = require("node:path");

app.whenReady().then(() => {
  // Muat turun kad (a[download]) terus ke folder ujian; tanpa ini Electron membuka dialog simpan.
  session.defaultSession.on("will-download", (_e, item) => item.setSavePath(join(process.env.DEGUP_SIM_WEB_MUAT, item.getFilename())));
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    show: true,
    webPreferences: { sandbox: true, contextIsolation: true, nodeIntegration: false },
  });
  void win.loadURL(process.env.DEGUP_SIM_WEB_URL);
});
app.on("window-all-closed", () => app.quit());
