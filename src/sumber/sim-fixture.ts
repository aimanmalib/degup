// Penjana fixture contoh berlabel simulasi (P2b): isyarat `PenjanaSim` + ketukan diskrip berhampiran degupan sebenar.
// Deterministik ikut `meta.jana`; ujian menjana semula dan membanding dengan `fixtures/sim-contoh.json`.
import { PengumpulFixture, type Fixture, type MetaFixture } from "../core/fixture.js";
import { mulberry32, PenjanaSim, type KonfigSim } from "./sim.js";

export interface JanaSimContoh {
  t0: number;
  benih: number;
  lihat_s: number;
  rasa_s: number;
  lentur_s: number;
  /** Ketukan = degupan sebenar + sesaran + jitter seragam ±; sebahagian degupan tidak diketuk. */
  ketuk_sesaran_ms: number;
  ketuk_jitter_ms: number;
  ketuk_kadar: number;
}

export function janaFixtureSim(sim: KonfigSim, j: JanaSimContoh, skema: number, label: string): Fixture {
  const tempoh = j.lihat_s + j.rasa_s + j.lentur_s;
  const penjana = new PenjanaSim({ ...sim, benih: j.benih }, j.t0);
  const kumpul = new PengumpulFixture();
  for (const m of penjana.jana(tempoh)) kumpul.tambahMetrik(m);

  const rawak = mulberry32(j.benih + 1);
  const mula = j.t0 + j.lihat_s * 1e6;
  const akhir = mula + j.rasa_s * 1e6;
  for (const b of penjana.degupanBenar(tempoh)) {
    if (b < mula || b >= akhir) continue;
    if (rawak() >= j.ketuk_kadar) continue;
    const t = b + (j.ketuk_sesaran_ms + (rawak() * 2 - 1) * j.ketuk_jitter_ms) * 1000;
    if (t >= mula && t < akhir) kumpul.tambahKetukan(t);
  }

  const meta: MetaFixture = {
    skema,
    jenis: "simulasi",
    label,
    tarikh: new Date(j.t0 / 1000).toISOString().slice(0, 10),
    babak: {
      lihat: [0, j.lihat_s],
      rasa: [j.lihat_s, j.lihat_s + j.rasa_s],
      lentur: [j.lihat_s + j.rasa_s, tempoh],
    },
    // Semua parameter (sim + ketukan) supaya ujian menjana semula tanpa bergantung pada config semasa.
    jana: { ...sim, ...j },
  };
  return kumpul.keFixture(meta);
}
