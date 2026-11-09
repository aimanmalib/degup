// Perakam demo (PRD §4.9): tetingkap Degup sendiri (main memberi ID media desktopCapturer tetingkap ini; getUserMedia
// `chromeMediaSource: desktop` menangkap terus ikut ID, tanpa senarai tetingkap atau pemilih skrin, D13) + MediaRecorder webm → ketul demi ketul ke main, yang menulis Video/Degup/degup-demo-<masa>.webm. Tiada audio.
// Berhenti dengan butang, bila trek tamat, bila main menolak ketul, atau automatik selepas skrin keputusan (app.ts).
import type { DegupApi } from "../preload/api.js";

export interface KonfigPerakam {
  fps: number;
  lebar: number;
  tinggi: number;
  mime: string;
  ketul_ms: number;
  bitrate: number;
}

export type KeadaanPerakam = "rehat" | "mula" | "rakam" | "simpan";

export class PerakamDemo {
  private rec: MediaRecorder | null = null;
  private strim: MediaStream | null = null;
  private rantai: Promise<unknown> = Promise.resolve();
  private _keadaan: KeadaanPerakam = "rehat";
  private pendengar: Array<() => void> = [];
  /** Nama fail rakaman terakhir yang disimpan; null = belum / gagal. */
  terakhir: string | null = null;
  gagal = false;

  constructor(
    private readonly api: DegupApi,
    private readonly kfg: KonfigPerakam,
  ) {}

  get keadaan(): KeadaanPerakam {
    return this._keadaan;
  }

  get aktif(): boolean {
    return this._keadaan === "mula" || this._keadaan === "rakam";
  }

  /** Pulang fungsi nyahdaftar (butang yang dibina semula tidak bocor pendengar). */
  dengar(f: () => void): () => void {
    this.pendengar.push(f);
    return () => {
      this.pendengar = this.pendengar.filter((x) => x !== f);
    };
  }

  private tukar(k: KeadaanPerakam): void {
    this._keadaan = k;
    for (const f of [...this.pendengar]) f();
  }

  async mula(): Promise<boolean> {
    if (this._keadaan !== "rehat") return false;
    this.terakhir = null;
    this.gagal = false;
    this.tukar("mula");
    const fail = await this.api.rakamMula();
    if (!fail.ok) return this.batal();
    try {
      // Kekangan `mandatory` Chromium untuk tangkapan desktop (Electron); jenis DOM tidak mengenalinya.
      const video = {
        mandatory: {
          chromeMediaSource: "desktop",
          chromeMediaSourceId: fail.sumber,
          maxWidth: this.kfg.lebar,
          maxHeight: this.kfg.tinggi,
          maxFrameRate: this.kfg.fps,
        },
      } as unknown as MediaTrackConstraints;
      this.strim = await navigator.mediaDevices.getUserMedia({ audio: false, video });
    } catch {
      await this.api.rakamTamat();
      return this.batal();
    }
    const mimeType = MediaRecorder.isTypeSupported(this.kfg.mime) ? this.kfg.mime : "video/webm";
    const rec = new MediaRecorder(this.strim, { mimeType, videoBitsPerSecond: this.kfg.bitrate });
    this.rec = rec;
    rec.ondataavailable = (e) => {
      if (e.data.size === 0) return;
      // Ikut urutan: setiap ketul ditulis selepas yang sebelumnya selesai.
      this.rantai = this.rantai.then(async () => {
        const ok = await this.api.rakamTulis(new Uint8Array(await e.data.arrayBuffer()));
        if (!ok) void this.henti();
      });
    };
    rec.onstop = () => void this.selesai();
    for (const trek of this.strim.getVideoTracks()) trek.addEventListener("ended", () => void this.henti());
    rec.start(this.kfg.ketul_ms);
    this.tukar("rakam");
    return true;
  }

  /** Henti (butang, keputusan, trek tamat). Fail disimpan dalam `selesai` selepas ketul terakhir ditulis. */
  async henti(): Promise<void> {
    if (this._keadaan !== "rakam" || !this.rec) return;
    this.tukar("simpan");
    if (this.rec.state !== "inactive") this.rec.stop();
    else await this.selesai();
  }

  private async selesai(): Promise<void> {
    await this.rantai;
    for (const trek of this.strim?.getTracks() ?? []) trek.stop();
    this.strim = null;
    this.rec = null;
    const h = await this.api.rakamTamat();
    this.terakhir = h.ok ? h.nama : null;
    this.gagal = !h.ok;
    this.tukar("rehat");
  }

  private batal(): false {
    this.gagal = true;
    this.tukar("rehat");
    return false;
  }
}
