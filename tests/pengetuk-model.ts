// Six tapper models for the honest-score test (K1): four tappers who feel nothing and two who feel something, scored by the
// real kiraSkor on synthetic beats. Shared by tests/pengetuk-tidak-merasa.test.ts and scripts/ukur-skor.mjs (one source).
// Model pengetuk K1 (PH§5.5): degupan 72 bpm, RSA ±4 bpm pada 0.1 Hz, hanyut ±3 bpm setiap 45 s. Berbenih, tanpa rangkaian.
import type { Degupan } from "../src/core/beats";
import { kiraSkor, type KonfigSkor } from "../src/core/score";
import { mulberry32 } from "../src/sumber/sim";

const US = 1e6;
const T0 = 1_762_000_000_000_000;

export interface KonfigModel {
  nadi_bpm: number;
  rsa_bpm: number;
  rsa_hz: number;
  hanyut_bpm: number;
  hanyut_tempoh_s: number;
  pusingan_s: number;
}

/** Takrif juri PH§5.5 K1 (supaya boleh diulang); bukan nilai app. */
export const MODEL_LALAI: KonfigModel = {
  nadi_bpm: 72,
  rsa_bpm: 4,
  rsa_hz: 0.1,
  hanyut_bpm: 3,
  hanyut_tempoh_s: 45,
  pusingan_s: 40,
};

export type Rawak = () => number;

function gauss(r: Rawak): number {
  const u = Math.max(r(), 1e-12);
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * r());
}

/** Masa degupan (s) dari −2 s hingga pusingan + 2 s: kadar = asas + RSA + hanyut, fasa awal rawak. */
export function janaDegupan(k: KonfigModel, r: Rawak): number[] {
  const fRsa = r() * 2 * Math.PI;
  const fHanyut = r() * 2 * Math.PI;
  const dt = 0.004;
  const out: number[] = [];
  let fasa = r();
  for (let t = -2; t < k.pusingan_s + 2; t += dt) {
    const bpm =
      k.nadi_bpm +
      k.rsa_bpm * Math.sin(2 * Math.PI * k.rsa_hz * t + fRsa) +
      k.hanyut_bpm * Math.sin((2 * Math.PI * t) / k.hanyut_tempoh_s + fHanyut);
    const seterusnya = fasa + (bpm / 60) * dt;
    if (Math.floor(seterusnya) > Math.floor(fasa)) out.push(t + dt * ((Math.ceil(fasa) - fasa) / (seterusnya - fasa)));
    fasa = seterusnya;
  }
  return out;
}

function rentak(tempohS: number, jitter: number, k: KonfigModel, r: Rawak): number[] {
  const out: number[] = [];
  for (let t = r() * tempohS; t < k.pusingan_s; t += tempohS * (1 + jitter * gauss(r))) out.push(t);
  return out;
}

function ikutDegupan(degup: number[], kadar: number, lewatS: number, sdS: number, r: Rawak): number[] {
  return degup.filter(() => r() < kadar).map((b) => b + lewatS + sdS * gauss(r));
}

/** Setiap model: degupan (s) → ketukan (s). Nama = id dalam jadual MEASUREMENTS. */
export const MODEL: Record<string, { label: string; merasa: boolean; ketuk: (d: number[], k: KonfigModel, r: Rawak) => number[] }> = {
  fasa_bebas: {
    label: "Independent phase each beat (feels nothing)",
    merasa: false,
    ketuk: (d, _k, r) => d.slice(0, -1).map((b, i) => b + r() * (d[i + 1]! - b)),
  },
  jarak_rawak: {
    label: "Random gaps 650 to 1,150 ms (feels nothing)",
    merasa: false,
    ketuk: (_d, k, r) => {
      const out: number[] = [];
      for (let t = r(); t < k.pusingan_s; t += 0.65 + 0.5 * r()) out.push(t);
      return out;
    },
  },
  rentak_dekat: {
    label: "Steady rhythm near pulse rate, 700 to 1,000 ms (feels nothing)",
    merasa: false,
    ketuk: (_d, k, r) => rentak(0.7 + 0.3 * r(), 0.05, k, r),
  },
  rentak_nadi: {
    label: "Steady rhythm at the mean pulse rate (feels nothing)",
    merasa: false,
    ketuk: (_d, k, r) => rentak(60 / k.nadi_bpm, 0.05, k, r),
  },
  merasa_lemah: {
    label: "Feels weakly: 50% of beats, +150 ms (SD 80), plus 25% random taps",
    merasa: true,
    ketuk: (d, k, r) => {
      const rawak = Array.from({ length: Math.round(0.25 * d.length) }, () => r() * k.pusingan_s);
      return [...ikutDegupan(d, 0.5, 0.15, 0.08, r), ...rawak];
    },
  },
  merasa_jelas: {
    label: "Feels clearly: 80% of beats, +150 ms (SD 60)",
    merasa: true,
    ketuk: (d, _k, r) => ikutDegupan(d, 0.8, 0.15, 0.06, r),
  },
};

/** Satu pusingan: degupan sintetik semuanya sah (kualiti 1), ketukan dari model, skor dari kiraSkor sebenar. */
export function pusingan(ketuk: (d: number[], k: KonfigModel, r: Rawak) => number[], kfg: KonfigSkor, r: Rawak, k = MODEL_LALAI) {
  const d = janaDegupan(k, r);
  const ketukan = ketuk(d, k, r).filter((t) => t >= 0 && t < k.pusingan_s);
  const degupan: Degupan[] = d.map((t) => ({ t: T0 + Math.round(t * US), ragu: false, jurang: false, bising: false }));
  return kiraSkor(
    {
      degupan,
      ketukan: ketukan.map((t) => T0 + Math.round(t * US)),
      mula: T0,
      akhir: T0 + k.pusingan_s * US,
      kualitiTetingkap: 1,
      kualitiPada: () => 1,
    },
    kfg,
  );
}

/** Peratus pusingan setiap jalur (null = tak cukup data) untuk satu model. */
export function kiraJalur(id: string, kfg: KonfigSkor, n: number, benih: number): Record<string, number> {
  const r = mulberry32(benih);
  const m = MODEL[id]!;
  const kira: Record<string, number> = {};
  for (let i = 0; i < n; i++) {
    const j = pusingan(m.ketuk, kfg, r).jalur ?? "tak_cukup";
    kira[j] = (kira[j] ?? 0) + 1;
  }
  for (const j of Object.keys(kira)) kira[j] = (100 * kira[j]!) / n;
  return kira;
}
