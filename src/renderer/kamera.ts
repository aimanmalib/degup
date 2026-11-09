// Kamera dimiliki renderer (corak electron-quickstart): strim yang sama dipakai pratonton dan SDK (`useMediaStream`).
// Mod sim/replay tidak membuka kamera langsung. Saiz/fps ideal dari config.sdk.kamera (lalai SDK 1280×720 / 30 fps).
export interface IdealKamera {
  lebar: number;
  tinggi: number;
  fps: number;
}

export class Kamera {
  private strim: MediaStream | null = null;
  private pendengar: Array<() => void> = [];

  get hidup(): boolean {
    return this.strim !== null;
  }

  get media(): MediaStream | null {
    return this.strim;
  }

  async buka(deviceId: string | null, ideal: IdealKamera): Promise<MediaStream> {
    this.tutup();
    this.strim = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        ...(deviceId ? { deviceId: { exact: deviceId } } : {}),
        width: { ideal: ideal.lebar },
        height: { ideal: ideal.tinggi },
        frameRate: { ideal: ideal.fps },
      },
    });
    this.maklum();
    return this.strim;
  }

  /** Mati serta-merta (Esc, "Matikan kamera", tutup babak): setiap trek dihentikan. */
  tutup(): void {
    if (!this.strim) return;
    for (const trek of this.strim.getTracks()) trek.stop();
    this.strim = null;
    this.maklum();
  }

  dengar(f: () => void): void {
    this.pendengar.push(f);
  }

  private maklum(): void {
    for (const f of this.pendengar) f();
  }
}

export async function senaraiKamera(): Promise<MediaDeviceInfo[]> {
  try {
    return (await navigator.mediaDevices.enumerateDevices()).filter((d) => d.kind === "videoinput");
  } catch {
    return [];
  }
}
