// Pengesan degupan dari jejak tekanan arteri SDK (PRD §4.3). Tulen: tiada DOM, tiada SDK.
// Semua parameter dari `config.beats`. Masa dalam µs sejak epoch (sama seperti SDK).
import { Biquad, Detrend, kelewatanFasa, lowpassButterworth, type PekaliBiquad } from "./isyarat.js";
import { keNombor, type MetrikSdk, type Sampel } from "./metrik.js";

export interface KonfigBeats {
  buffer_s: number;
  kadar_hz: number;
  detrend_s: number;
  lowpass_hz: number;
  ambang_k_sisihan: number;
  ambang_tetingkap_s: number;
  refraktori_ms: number;
  ragu_bawah: number;
  ragu_atas: number;
  jurang_s: number;
  keyakinan_stabil: number;
  semak_kendiri_s: number;
  semak_kendiri_toleransi: number;
  sandaran_pulse_trace_selepas_s: number;
  nadi_lalai_bpm: number;
}

export interface Degupan {
  /** Masa degupan (µs epoch), selepas pembetulan kelewatan penapis. */
  t: number;
  /** Sela dari degupan sebelum tidak munasabah (PRD §4.3 langkah 4): tidak dipakai untuk fasa. */
  ragu: boolean;
  /** Jurang > `jurang_s` sebelum degupan ini. */
  jurang: boolean;
  /** Dalam tetingkap yang gagal semakan kendiri (langkah 5): dikecualikan dari skor. */
  bising: boolean;
}

export interface AmaranBising {
  mula: number;
  akhir: number;
  bpmPuncak: number;
  bpmSdk: number;
}

const US = 1e6;

export class PengesanDegupan {
  private readonly fs: number;
  private readonly langkahUs: number;
  private readonly k: PekaliBiquad;
  private readonly nDetrend: number;
  private detrend: Detrend;
  private biquad: Biquad;

  // Grid seragam: masa (µs), nilai ditapis, keyakinan. Dipangkas ke `buffer_s`.
  private gridT: number[] = [];
  private gridY: number[] = [];
  private tGridSeterusnya: number | null = null;
  private mentahAkhir: Sampel | null = null;

  private tArteriAkhir: number | null = null;
  private nadiTerkini: { v: number; c: number } | null = null;
  private nadiStabil: number | null = null;

  private readonly semua: Degupan[] = [];
  private readonly amaran: AmaranBising[] = [];
  private readonly kualiti = new Map<number, { baik: number; jumlah: number }>();
  private tSemakSeterusnya: number | null = null;

  constructor(private readonly kfg: KonfigBeats) {
    this.fs = kfg.kadar_hz;
    this.langkahUs = US / this.fs;
    this.k = lowpassButterworth(kfg.lowpass_hz, this.fs);
    this.nDetrend = Math.max(1, Math.round(kfg.detrend_s * this.fs));
    this.detrend = new Detrend(this.nDetrend);
    this.biquad = new Biquad(this.k);
  }

  /** Suap satu payload `metrics`; pulangkan degupan baharu yang dikesan. */
  tambahMetrik(m: MetrikSdk): Degupan[] {
    for (const p of m.cardio?.pulseRate ?? []) this.tambahNadi(p.value, p.confidence);
    for (const p of m.pulse?.rate ?? []) this.tambahNadi(p.value, p.confidence);

    const baharu: Degupan[] = [];
    const arteri = m.cardio?.arterialPressureTrace ?? [];
    for (const s of arteri) {
      const t = keNombor(s.timestamp);
      if (t === null || typeof s.value !== "number") continue;
      this.tArteriAkhir = Math.max(this.tArteriAkhir ?? t, t);
      baharu.push(...this.tambahSampel({ t, v: s.value, c: s.confidence ?? 0 }));
    }

    // Sandaran: `pulse.trace` bila jejak arteri kosong > N s; keyakinan = keyakinan nadi terkini.
    const had = this.kfg.sandaran_pulse_trace_selepas_s * US;
    for (const s of m.pulse?.trace ?? []) {
      const t = keNombor(s.timestamp);
      if (t === null || typeof s.value !== "number") continue;
      if (this.tArteriAkhir !== null && t - this.tArteriAkhir <= had) continue;
      baharu.push(...this.tambahSampel({ t, v: s.value, c: this.nadiTerkini?.c ?? 0 }));
    }
    return baharu;
  }

  private tambahNadi(v: number | null | undefined, c: number | null | undefined): void {
    if (typeof v !== "number" || v <= 0) return;
    const keyakinan = c ?? 0;
    this.nadiTerkini = { v, c: keyakinan };
    if (keyakinan >= this.kfg.keyakinan_stabil) this.nadiStabil = v;
  }

  /** Satu sampel mentah → sampel semula linear ke grid 30 Hz → penapis → pengesan puncak. */
  tambahSampel(s: Sampel): Degupan[] {
    const akhir = this.mentahAkhir;
    if (akhir && s.t <= akhir.t) return [];
    const keluar: Degupan[] = [];
    if (!akhir) {
      this.tGridSeterusnya = s.t;
    } else if (s.t - akhir.t > this.kfg.jurang_s * US) {
      // Jurang besar: jangan interpolasi merentasinya; mula semula penapis dan grid.
      this.setSemulaAliran();
      this.tGridSeterusnya = s.t;
    }
    const a = this.mentahAkhir;
    while (this.tGridSeterusnya !== null && this.tGridSeterusnya <= s.t) {
      const tg = this.tGridSeterusnya;
      let v = s.v;
      let c = s.c;
      if (a && s.t > a.t) {
        const r = (tg - a.t) / (s.t - a.t);
        v = a.v + r * (s.v - a.v);
        c = r < 0.5 ? a.c : s.c;
      }
      const d = this.prosesGrid(tg, v, c);
      if (d) keluar.push(d);
      this.tGridSeterusnya = tg + this.langkahUs;
    }
    this.mentahAkhir = s;
    return keluar;
  }

  private setSemulaAliran(): void {
    this.detrend = new Detrend(this.nDetrend);
    this.biquad = new Biquad(this.k);
    this.gridT = [];
    this.gridY = [];
  }

  private prosesGrid(t: number, v: number, c: number): Degupan | null {
    const y = this.biquad.proses(this.detrend.proses(v));
    this.gridT.push(t);
    this.gridY.push(y);
    const hadBuffer = Math.round(this.kfg.buffer_s * this.fs);
    if (this.gridT.length > hadBuffer) {
      this.gridT.shift();
      this.gridY.shift();
    }
    this.catatKualiti(t, c);
    const d = this.semakPuncak();
    this.semakKendiri(t);
    return d;
  }

  private catatKualiti(t: number, c: number): void {
    const saat = Math.floor(t / US);
    const k = this.kualiti.get(saat) ?? { baik: 0, jumlah: 0 };
    k.jumlah++;
    if (c >= this.kfg.keyakinan_stabil) k.baik++;
    this.kualiti.set(saat, k);
  }

  /** Sampel kedua terakhir ialah puncak jika maksimum tempatan dan atas ambang adaptif. */
  private semakPuncak(): Degupan | null {
    const n = this.gridY.length;
    const nAmbang = Math.round(this.kfg.ambang_tetingkap_s * this.fs);
    if (n < Math.max(3, nAmbang, this.nDetrend)) return null;
    const y0 = this.gridY[n - 3] as number;
    const y1 = this.gridY[n - 2] as number;
    const y2 = this.gridY[n - 1] as number;
    if (!(y1 > y0 && y1 >= y2)) return null;

    let jumlah = 0;
    let jumlah2 = 0;
    for (let i = n - nAmbang; i < n; i++) {
      const y = this.gridY[i] as number;
      jumlah += y;
      jumlah2 += y * y;
    }
    const purata = jumlah / nAmbang;
    const sisihan = Math.sqrt(Math.max(0, jumlah2 / nAmbang - purata * purata));
    if (y1 <= purata + this.kfg.ambang_k_sisihan * sisihan) return null;

    // Interpolasi parabola tiga titik.
    const penyebut = y0 - 2 * y1 + y2;
    const anjak = penyebut === 0 ? 0 : (0.5 * (y0 - y2)) / penyebut;
    const tPuncak = (this.gridT[n - 2] as number) + anjak * this.langkahUs;
    const t = tPuncak - this.kelewatanUs();

    const sebelum = this.semua[this.semua.length - 1];
    if (sebelum && t - sebelum.t < this.kfg.refraktori_ms * 1000) return null;

    let ragu = false;
    let jurang = false;
    if (sebelum) {
      const sela = (t - sebelum.t) / US;
      if (sela > this.kfg.jurang_s) jurang = true;
      else if (this.nadiStabil !== null) {
        const jangka = 60 / this.nadiStabil;
        ragu = sela < this.kfg.ragu_bawah * jangka || sela > this.kfg.ragu_atas * jangka;
      }
    }
    const d: Degupan = { t, ragu, jurang, bising: false };
    this.semua.push(d);
    return d;
  }

  /** Kelewatan detrend + biquad pada frekuensi nadi semasa (D6). */
  private kelewatanUs(): number {
    const bpm = this.nadiStabil ?? this.nadiTerkini?.v ?? this.kfg.nadi_lalai_bpm;
    return kelewatanFasa(bpm / 60, this.fs, this.nDetrend, this.k) * US;
  }

  /** Setiap `semak_kendiri_s`: kadar dari puncak lawan `pulse_rate` SDK; beza > toleransi → bising. */
  private semakKendiri(t: number): void {
    const tempoh = this.kfg.semak_kendiri_s * US;
    if (this.tSemakSeterusnya === null) this.tSemakSeterusnya = t + tempoh;
    if (t < this.tSemakSeterusnya) return;
    const mula = this.tSemakSeterusnya - tempoh;
    const akhir = this.tSemakSeterusnya;
    this.tSemakSeterusnya += tempoh;
    const bpmSdk = this.nadiTerkini?.v;
    if (bpmSdk === undefined) return;
    const dalam = this.semua.filter((d) => d.t >= mula && d.t < akhir);
    const bpmPuncak =
      dalam.length >= 2
        ? ((dalam.length - 1) * 60 * US) / ((dalam[dalam.length - 1] as Degupan).t - (dalam[0] as Degupan).t)
        : 0;
    if (Math.abs(bpmPuncak - bpmSdk) / bpmSdk > this.kfg.semak_kendiri_toleransi) {
      for (const d of dalam) d.bising = true;
      this.amaran.push({ mula, akhir, bpmPuncak, bpmSdk });
    }
  }

  degupan(): readonly Degupan[] {
    return this.semua;
  }

  amaranBising(): readonly AmaranBising[] {
    return this.amaran;
  }

  /** Pecahan sampel grid dengan keyakinan ≥ ambang stabil dalam [mula, akhir) µs; null jika tiada sampel. */
  kualitiAntara(mula: number, akhir: number): number | null {
    let baik = 0;
    let jumlah = 0;
    for (let s = Math.floor(mula / US); s < Math.ceil(akhir / US); s++) {
      const k = this.kualiti.get(s);
      if (k) {
        baik += k.baik;
        jumlah += k.jumlah;
      }
    }
    return jumlah === 0 ? null : baik / jumlah;
  }

  /** Kualiti setiap saat (saat epoch → pecahan), untuk jalur kualiti pendedahan. */
  kualitiSetiapSaat(): Map<number, number> {
    const m = new Map<number, number>();
    for (const [s, k] of this.kualiti) m.set(s, k.baik / k.jumlah);
    return m;
  }
}
