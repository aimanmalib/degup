// Penapis isyarat untuk pengesan degupan (PRD §4.3 langkah 2). Tulen: tiada DOM, tiada SDK.

export interface PekaliBiquad {
  b0: number;
  b1: number;
  b2: number;
  a1: number;
  a2: number;
}

/** Butterworth low-pass tertib 2 (Q = 1/√2), resipi RBJ, dinormalkan a0 = 1. */
export function lowpassButterworth(fc: number, fs: number): PekaliBiquad {
  const w0 = (2 * Math.PI * fc) / fs;
  const cos = Math.cos(w0);
  const alpha = Math.sin(w0) / (2 * Math.SQRT1_2);
  const a0 = 1 + alpha;
  const b0 = (1 - cos) / 2 / a0;
  return { b0, b1: (1 - cos) / a0, b2: b0, a1: (-2 * cos) / a0, a2: (1 - alpha) / a0 };
}

/** Biquad kausal (bentuk terus I) yang memproses satu sampel pada satu masa. */
export class Biquad {
  private x1 = 0;
  private x2 = 0;
  private y1 = 0;
  private y2 = 0;
  private mula = true;

  constructor(private readonly k: PekaliBiquad) {}

  proses(x: number): number {
    if (this.mula) {
      // Mula dari keadaan mantap pada nilai pertama supaya tiada lonjakan permulaan.
      this.x1 = this.x2 = this.y1 = this.y2 = x;
      this.mula = false;
    }
    const { b0, b1, b2, a1, a2 } = this.k;
    const y = b0 * x + b1 * this.x1 + b2 * this.x2 - a1 * this.y1 - a2 * this.y2;
    this.x2 = this.x1;
    this.x1 = x;
    this.y2 = this.y1;
    this.y1 = y;
    return y;
  }
}

/** Detrend kausal: x tolak purata bergerak N sampel terakhir (termasuk x). */
export class Detrend {
  private readonly tingkap: number[] = [];
  private jumlah = 0;

  constructor(private readonly n: number) {}

  proses(x: number): number {
    this.tingkap.push(x);
    this.jumlah += x;
    if (this.tingkap.length > this.n) this.jumlah -= this.tingkap.shift() as number;
    return x - this.jumlah / this.tingkap.length;
  }
}

/**
 * Kelewatan fasa (saat) rantai detrend + biquad pada frekuensi f (Hz).
 * Untuk sinusoid, puncak keluaran lewat tepat sebanyak ini; pengesan menolaknya dari masa puncak (D6).
 */
export function kelewatanFasa(f: number, fs: number, nDetrend: number, k: PekaliBiquad): number {
  const w = (2 * Math.PI * f) / fs;
  // Purata bergerak M(w) = (1/N) Σ e^{-jwk}
  let mRe = 0;
  let mIm = 0;
  for (let i = 0; i < nDetrend; i++) {
    mRe += Math.cos(w * i);
    mIm -= Math.sin(w * i);
  }
  const dRe = 1 - mRe / nDetrend;
  const dIm = -mIm / nDetrend;
  // Biquad B(w)
  const c1 = Math.cos(w);
  const s1 = Math.sin(w);
  const c2 = Math.cos(2 * w);
  const s2 = Math.sin(2 * w);
  const nRe = k.b0 + k.b1 * c1 + k.b2 * c2;
  const nIm = -(k.b1 * s1 + k.b2 * s2);
  const pRe = 1 + k.a1 * c1 + k.a2 * c2;
  const pIm = -(k.a1 * s1 + k.a2 * s2);
  const fasa = Math.atan2(dIm, dRe) + Math.atan2(nIm, nRe) - Math.atan2(pIm, pRe);
  return -fasa / w / fs; // sampel → saat
}
