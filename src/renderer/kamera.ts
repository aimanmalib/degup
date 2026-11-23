// Kamera dimiliki renderer (corak electron-quickstart): strim yang sama dipakai pratonton dan SDK (`useMediaStream`).
// Mod sim/replay tidak membuka kamera langsung. Saiz/fps ideal dari config.sdk.kamera (lalai SDK 1280×720 / 30 fps).
export interface IdealKamera {
  lebar: number;
  tinggi: number;
  fps: number;
}

export class Kamera {
  private strim: MediaStream | null = null;
  private kecil: { strim: MediaStream; henti: () => void } | null = null;
  private pendengar: Array<() => void> = [];

  get hidup(): boolean {
    return this.strim !== null;
  }

  get media(): MediaStream | null {
    return this.strim;
  }

  /** Strim untuk SDK: bingkai dikecilkan (config.sdk.bingkai_sdk); pratonton kekal memakai `media`. */
  get mediaSdk(): MediaStream | null {
    return this.kecil?.strim ?? this.strim;
  }

  async buka(deviceId: string | null, ideal: IdealKamera, sisiPanjangMaks = 0, fpsMaks = 0): Promise<MediaStream> {
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
    this.kecil = sisiPanjangMaks > 0 || fpsMaks > 0 ? kecilkan(this.strim, sisiPanjangMaks, fpsMaks) : null;
    this.maklum();
    return this.strim;
  }

  /** Mati serta-merta (Esc, "Matikan kamera", tutup babak): setiap trek dihentikan. */
  tutup(): void {
    if (!this.strim) return;
    this.kecil?.henti();
    this.kecil = null;
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

// The SDK renderer frame loop copies every frame as full RGBA at codedWidth x codedHeight. Some cameras deliver 1280-wide frames
// even when getSettings() reports 640x360, and the copy then falls below the frame rate the SDK needs (validation code 11).
// Frames are scaled down here, before the SDK sees them; the timestamp of each frame is kept.
// Bingkai dikecilkan sebelum SDK (MediaStreamTrackProcessor → OffscreenCanvas → MediaStreamTrackGenerator); cap masa dikekalkan.
// Pelayar tanpa API itu, atau bingkai yang sudah kecil: strim asal dipakai.
interface PembinaTrek {
  MediaStreamTrackProcessor?: new (o: { track: MediaStreamTrack }) => { readable: ReadableStream<VideoFrame> };
  MediaStreamTrackGenerator?: new (o: { kind: "video" }) => MediaStreamTrack & { writable: WritableStream<VideoFrame> };
}

export function saizKecil(lebar: number, tinggi: number, sisiPanjangMaks: number): { lebar: number; tinggi: number } | null {
  const panjang = Math.max(lebar, tinggi);
  if (sisiPanjangMaks <= 0 || panjang <= sisiPanjangMaks) return null;
  const skala = sisiPanjangMaks / panjang;
  const genap = (n: number) => Math.max(2, Math.round((n * skala) / 2) * 2);
  return { lebar: genap(lebar), tinggi: genap(tinggi) };
}

function kecilkan(strim: MediaStream, sisiPanjangMaks: number, fpsMaks: number): { strim: MediaStream; henti: () => void } | null {
  const g = globalThis as unknown as PembinaTrek;
  const trek = strim.getVideoTracks()[0];
  if (!trek || !g.MediaStreamTrackProcessor || !g.MediaStreamTrackGenerator || typeof OffscreenCanvas === "undefined") return null;
  const pemproses = new g.MediaStreamTrackProcessor({ track: trek });
  const penjana = new g.MediaStreamTrackGenerator({ kind: "video" });
  const kanvas = new OffscreenCanvas(2, 2);
  const ctx = kanvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  // fpsMaks > 0: bingkai yang tiba lebih awal daripada 0.9 selang sasaran dibuang (cap masa bingkai yang tinggal tidak diubah).
  const selangMinUs = fpsMaks > 0 ? (1e6 / fpsMaks) * 0.9 : 0;
  let akhirUs = -Infinity;
  const ubah = new TransformStream<VideoFrame, VideoFrame>({
    transform(bingkai, kawal) {
      if (selangMinUs > 0 && bingkai.timestamp - akhirUs < selangMinUs) {
        bingkai.close();
        return;
      }
      akhirUs = bingkai.timestamp;
      const saiz = saizKecil(bingkai.codedWidth, bingkai.codedHeight, sisiPanjangMaks);
      if (!saiz) {
        kawal.enqueue(bingkai);
        return;
      }
      if (kanvas.width !== saiz.lebar || kanvas.height !== saiz.tinggi) {
        kanvas.width = saiz.lebar;
        kanvas.height = saiz.tinggi;
      }
      ctx.drawImage(bingkai, 0, 0, saiz.lebar, saiz.tinggi);
      const kecil = new VideoFrame(kanvas, { timestamp: bingkai.timestamp });
      bingkai.close();
      kawal.enqueue(kecil);
    },
  });
  const batal = new AbortController();
  void pemproses.readable
    .pipeThrough(ubah, { signal: batal.signal })
    .pipeTo(penjana.writable)
    .catch(() => undefined);
  return {
    strim: new MediaStream([penjana]),
    henti: () => {
      batal.abort();
      penjana.stop();
    },
  };
}
