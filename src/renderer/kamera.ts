// Kamera dimiliki renderer (corak electron-quickstart). P3a: pratonton + petunjuk sahaja; SDK disambung P4a (useMediaStream).
// Mod sim/replay tidak membuka kamera langsung.
export class Kamera {
  private strim: MediaStream | null = null;
  private pendengar: Array<() => void> = [];

  get hidup(): boolean {
    return this.strim !== null;
  }

  get media(): MediaStream | null {
    return this.strim;
  }

  async buka(deviceId: string | null): Promise<MediaStream> {
    this.tutup();
    this.strim = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: deviceId ? { deviceId: { exact: deviceId } } : true,
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
