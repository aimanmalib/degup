// Pembantu ujian: jalankan PenjanaSim → PengesanDegupan (bukan nilai app; toleransi ujian sahaja).
import app from "../config/app.json";
import { PengesanDegupan, type KonfigBeats } from "../src/core/beats";
import { PenjanaSim, type KonfigSim } from "../src/sumber/sim";

export const US = 1e6;
export const T0 = 1_762_000_000_000_000;
export const KFG_BEATS = app.beats as KonfigBeats;

export function larianSim(sim: Partial<KonfigSim>, tempoh_s: number) {
  const penjana = new PenjanaSim({ ...(app.sim as KonfigSim), ...sim }, T0);
  const pengesan = new PengesanDegupan(KFG_BEATS);
  const nafas: { t: number; v: number; stabil: boolean }[] = [];
  const prq: { v: number; stabil: boolean }[] = [];
  for (const m of penjana.jana(tempoh_s)) {
    pengesan.tambahMetrik(m);
    for (const u of m.breathing?.upperTrace ?? [])
      nafas.push({ t: Number(u.timestamp), v: u.value ?? 0, stabil: u.stable ?? false });
    const q = m.pulse?.pulseRespirationQuotient;
    for (const u of Array.isArray(q) ? q : q ? [q] : []) prq.push({ v: u.value ?? NaN, stabil: u.stable ?? false });
  }
  return { penjana, pengesan, benar: penjana.degupanBenar(tempoh_s), nafas, prq };
}
