// Main-process SDK setup: loads `bindSmartSpectraIpc(win)` lazily, only when the renderer starts the live source.
// Sets the native library path and, on Linux without a GPU driver, the Vulkan lavapipe ICD before the SDK is required.
// Penyediaan SDK di proses main (PRD §4.11, corak `electron-quickstart`): `bindSmartSpectraIpc(win)` dimuat MALAS, hanya bila
// renderer memulakan sumber `live`. Pakej SDK memuat pustaka asli semasa `require`; mod sim/replay (ujian, juri tanpa kunci)
// tidak pernah menyentuhnya. Persekitaran (laluan pustaka bila dipakej, Vulkan lavapipe Linux) ditetapkan SEBELUM `require`.
import { existsSync } from "node:fs";
import { join } from "node:path";

const NAMA_PUSTAKA: Record<string, string> = {
  darwin: "libsmartspectra_capi.dylib",
  linux: "libsmartspectra_capi.so",
  win32: "smartspectra_capi.dll",
};

/** Laluan pustaka C SDK dalam app dipakej (`app.asar.unpacked`); null bila platform tidak disokong. */
export function laluanCapi(resources: string, pakej: string, platform: string, arch: string): string | null {
  const lib = NAMA_PUSTAKA[platform];
  if (!lib) return null;
  return join(resources, "app.asar.unpacked", "node_modules", `${pakej}-${platform}-${arch}`, lib);
}

export interface KonteksSdk {
  dipakej: boolean;
  resources: string;
  pakej: string;
  platform: string;
  arch: string;
  vulkanIcdLinux: string;
  wujud: (laluan: string) => boolean;
}

/** Tetapkan env yang SDK baca semasa dimuat. Nilai yang pengguna sudah tetapkan tidak ditindih. Pulang kunci yang ditetapkan. */
export function sediaPersekitaran(env: Record<string, string | undefined>, k: KonteksSdk): string[] {
  const ditetap: string[] = [];
  if (k.dipakej && !env.SMARTSPECTRA_CAPI_PATH) {
    const l = laluanCapi(k.resources, k.pakej, k.platform, k.arch);
    if (l && k.wujud(l)) {
      env.SMARTSPECTRA_CAPI_PATH = l;
      ditetap.push("SMARTSPECTRA_CAPI_PATH");
    }
  }
  // Linux tanpa pemacu Vulkan GPU: Mesa lavapipe (PRD §4.11; docs/MEASUREMENTS.md merekod yang berjaya).
  if (k.platform === "linux" && !env.VK_ICD_FILENAMES && k.wujud(k.vulkanIcdLinux)) {
    env.VK_ICD_FILENAMES = k.vulkanIcdLinux;
    ditetap.push("VK_ICD_FILENAMES");
  }
  return ditetap;
}

export type HasilSediaLive = { ok: true; kunci: string } | { ok: false; sebab: "kunci" | "sdk" };

/** Pengikat sekali setiap tetingkap. `muat` = `require("@smartspectra/node-sdk/main")` (disuntik untuk ujian). */
export class PengikatSdk<W> {
  private terikat = new WeakSet<object>();

  constructor(
    private readonly muat: () => { bindSmartSpectraIpc(w: W): void },
    private readonly kunci: () => string | null,
    private readonly sediaEnv: () => void,
  ) {}

  sedia(win: W & object): HasilSediaLive {
    const kunci = this.kunci();
    if (!kunci) return { ok: false, sebab: "kunci" };
    if (!this.terikat.has(win)) {
      try {
        this.sediaEnv();
        this.muat().bindSmartSpectraIpc(win);
      } catch {
        return { ok: false, sebab: "sdk" };
      }
      this.terikat.add(win);
    }
    return { ok: true, kunci };
  }
}

export const wujudFail = (l: string) => existsSync(l);
