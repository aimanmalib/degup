// Halaman Simulation dalam pelayar (J8, docs/sim/): pengganti jambatan preload `window.degup` untuk renderer SEBENAR.
// Sumber sentiasa `sim`: tiada SDK, tiada kamera, tiada kunci disimpan, tiada rangkaian. Tetapan dalam localStorage;
// kad keputusan dimuat turun oleh pelayar. Storan + muat turun disuntik supaya modul ini diuji vitest tanpa DOM.
import type { DegupApi, Permulaan, Tetapan } from "../preload/api.js";
import { gabungTetapan, pilihBahasa, tetapanLalai } from "../core/tetapan.js";

export interface StoranRingkas {
  getItem(k: string): string | null;
  setItem(k: string, v: string): void;
  removeItem(k: string): void;
}

export interface KonfigPelayar {
  bahasa_lalai: string;
  bahasa_undur: string;
  bahasa: readonly string[];
  bunyi_lalai: boolean;
  /** Kunci localStorage untuk tetapan. */
  kunci_storan: string;
  /** Parameter URL skala masa babak (ujian; 0 < x ≤ 1). */
  param_skala: string;
  awalan_kad: string;
  pautan: Record<string, string>;
}

export interface PersekitaranPelayar {
  storan: StoranRingkas;
  locale: string;
  /** `location.search` */
  carian: string;
  versi: string;
  kini(): Date;
  muatTurun(nama: string, bait: Uint8Array): void;
  buka(url: string): void;
}

/** Skala masa dari URL: hanya 0 < x ≤ 1, selain itu 1. */
export function skalaDariCarian(carian: string, param: string): number {
  const x = Number(new URLSearchParams(carian).get(param));
  return x > 0 && x <= 1 ? x : 1;
}

/** Nama kad muat turun, corak sama dengan app (`<awalan>YYYYMMDD-HHMMSS.png`, masa tempatan). */
export function namaKad(awalan: string, d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${awalan}${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}.png`;
}

export function ciptaApiPelayar(k: KonfigPelayar, p: PersekitaranPelayar): DegupApi {
  const lalai = tetapanLalai(pilihBahasa(k.bahasa_lalai, p.locale, k.bahasa, k.bahasa_undur), k.bunyi_lalai);
  const ditulis: string[] = [];
  let kadAkhir: { nama: string; bait: Uint8Array } | null = null;

  const baca = (): Tetapan => {
    try {
      return gabungTetapan(lalai, JSON.parse(p.storan.getItem(k.kunci_storan) ?? "null"), k.bahasa);
    } catch {
      return { ...lalai };
    }
  };
  const tiada = { ok: false } as const;

  return {
    mula: async (): Promise<Permulaan> => ({
      tetapan: baca(),
      versi: p.versi,
      sumberEnv: "sim",
      fixtures: [],
      skalaMasa: skalaDariCarian(p.carian, k.param_skala),
      kunciAda: false,
      failDitulis: [...ditulis],
    }),
    simpanTetapan: async (ubah) => {
      const t = gabungTetapan(lalai, { ...baca(), ...ubah }, k.bahasa);
      try {
        p.storan.setItem(k.kunci_storan, JSON.stringify(t));
      } catch {
        // storan penuh / mod peribadi: tetapan kekal untuk sesi ini sahaja
      }
      return t;
    },
    // Halaman awam tidak pernah menyimpan kunci API (tiada storan terenkripsi dalam pelayar).
    simpanKunci: async () => ({ ok: false, sebab: "storan" }),
    padamKunci: async () => {},
    padamSemua: async () => {
      p.storan.removeItem(k.kunci_storan);
      const lama = [...ditulis];
      ditulis.length = 0;
      kadAkhir = null;
      return lama;
    },
    failDitulis: async () => [...ditulis],
    bukaPautan: async (id) => {
      const url = k.pautan[id];
      if (url && url.startsWith("https://")) p.buka(url);
    },
    bacaFixture: async () => null,
    simpanKad: async (png) => {
      if (!(png instanceof Uint8Array) || png.length === 0) return tiada;
      const nama = namaKad(k.awalan_kad, p.kini());
      p.muatTurun(nama, png);
      kadAkhir = { nama, bait: png };
      if (!ditulis.includes(nama)) ditulis.push(nama);
      return { ok: true, nama };
    },
    // Tiada folder dalam pelayar: muat turun semula kad terakhir.
    bukaFolderKad: async () => {
      if (kadAkhir) p.muatTurun(kadAkhir.nama, kadAkhir.bait);
    },
    sediaLive: async () => ({ ok: false, sebab: "sdk" }),
    rakamMula: async () => tiada,
    rakamTulis: async () => false,
    rakamTamat: async () => tiada,
    simpanFixture: async () => tiada,
    diag: () => {},
  };
}
