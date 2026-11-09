// Pelancar Electron untuk ujian: folder data sementara sendiri, sumber dari env (lalai sim), tangkapan bukti pilihan.
import { _electron as electron, type ElectronApplication, type Page } from "@playwright/test";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

export interface Lancar {
  app: ElectronApplication;
  win: Page;
  data: string;
  tutup(): Promise<void>;
}

export async function lancar(sumber = "sim", envTambahan: Record<string, string> = {}): Promise<Lancar> {
  const data = mkdtempSync(join(tmpdir(), "degup-e2e-"));
  const env: Record<string, string> = {};
  for (const [k, v] of Object.entries(process.env)) if (v !== undefined) env[k] = v;
  env.DEGUP_SUMBER = sumber;
  env.DEGUP_DATA = data;
  env.DEGUP_UJI_STORAN_ASAS = "1";
  Object.assign(env, envTambahan);
  // --no-sandbox: pelari CI (Ubuntu 24.04 AppArmor) tiada chrome-sandbox SUID. --password-store=basic + DEGUP_UJI_STORAN_ASAS:
  // xvfb tiada keyring, jadi safeStorage Linux menolak (app sebenar memaparkan "tiada storan terenkripsi"; diuji unit tests/simpanan.test.ts).
  const app = await electron.launch({ args: ["--no-sandbox", "--password-store=basic", "."], env });
  const win = await app.firstWindow();
  // xvfb tanpa pengurus tetingkap boleh memberi saiz minimum; paksa saiz lalai config (1280×800) supaya bukti sama dengan app.
  await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0]?.setContentSize(1280, 800));
  await win.waitForSelector("[data-uji=senarai-izin]");
  return {
    app,
    win,
    data,
    async tutup() {
      await app.close();
      rmSync(data, { recursive: true, force: true });
    },
  };
}

/** Tangkapan bukti ke $AUTOPILOT_BUKTI_DIR bila ditetapkan (ujian-pelayar.sh); tiada = langkau. */
export async function bukti(win: Page, nama: string, potongan = "p3a"): Promise<void> {
  const folder = process.env.AUTOPILOT_BUKTI_DIR;
  if (!folder) return;
  await win.waitForTimeout(450); // helaian selesai gelongsor (--tempoh-helaian)
  await win.screenshot({ path: join(folder, `degup-${potongan}-${nama}.png`) });
}

export type Lang = any;
/** Teks dari lang/ (ujian tidak menyalin teks UI). */
export function bacaLang(b: "ms" | "en"): Lang {
  return JSON.parse(readFileSync(new URL(`../lang/${b}.json`, import.meta.url), "utf8"));
}

/** config/app.json (ESM Playwright perlu atribut import untuk JSON; baca sebagai fail). */
export function bacaKonfig(): Lang {
  return JSON.parse(readFileSync(new URL("../config/app.json", import.meta.url), "utf8"));
}
