// P3b teras: petunjuk SDK → kunci lang + jeda, penjejak nadi stabil (LIHAT "Sedia"), garis masa + ayat pendedahan.
import { describe, expect, it } from "vitest";
import app from "../config/app.json";
import en from "../lang/en.json";
import ms from "../lang/ms.json";
import type { Degupan } from "../src/core/beats";
import { ayatDedah, garisMasa } from "../src/core/dedah";
import { KOD_PETUNJUK, kunciPetunjuk, PenjejakJeda } from "../src/core/petunjuk";
import { kiraSkor, type KonfigSkor } from "../src/core/score";
import { PenjejakStabil } from "../src/core/stabil";
import { larianSim, T0, US } from "./bantu-sim";

const dapat = (o: unknown, kunci: string): unknown => kunci.split(".").reduce<any>((x, k) => x?.[k], o);

describe("petunjuk SDK (validationStatus)", () => {
  it("setiap kod SDK 3.4.0 (0–7, 10–17) dan sandaran ada teks BM + EN", () => {
    const kod = [0, 1, 2, 3, 4, 5, 6, 7, 10, 11, 12, 13, 14, 15, 16, 17];
    expect(Object.keys(KOD_PETUNJUK).map(Number).sort((a, b) => a - b)).toEqual(kod);
    for (const k of [...kod, 99]) {
      expect(typeof dapat(ms, kunciPetunjuk(k))).toBe("string");
      expect(typeof dapat(en, kunciPetunjuk(k))).toBe("string");
    }
    expect(kunciPetunjuk(99)).toBe("petunjuk.lain");
  });

  it("jeda bermula pada kod bukan OK, tamat pada OK; ulang hanya selepas had", () => {
    const j = new PenjejakJeda();
    expect(j.kemas(0, T0)).toBe(false);
    expect(j.kemas(12, T0 + US)).toBe(true);
    expect(j.dijeda).toBe(true);
    // Kod berubah dalam jeda: jeda yang sama, masa mula tidak dianjak.
    expect(j.kemas(1, T0 + 5 * US)).toBe(false);
    expect(j.kodSemasa).toBe(1);
    expect(j.perluUlang(T0 + 20 * US, 20)).toBe(false);
    expect(j.perluUlang(T0 + 21.5 * US, 20)).toBe(true);
    expect(j.kemas(0, T0 + 22 * US)).toBe(true);
    expect(j.dijeda).toBe(false);
    expect(j.tempohUs(T0 + 30 * US)).toBe(0);
  });
});

describe("penjejak nadi LIHAT", () => {
  const nadi = (t: number, value: number, confidence: number, stable?: boolean) => ({
    cardio: { pulseRate: [{ value, confidence, stable, timestamp: t }] },
  });

  it("stabil sejak ukuran stabil pertama; putus menetap semula", () => {
    const p = new PenjejakStabil(app.beats.keyakinan_stabil);
    p.tambahMetrik(nadi(T0, 70, 10, false));
    expect(p.stabilSelamaS(T0 + 5 * US)).toBe(0);
    p.tambahMetrik(nadi(T0 + US, 71, 80, true));
    p.tambahMetrik(nadi(T0 + 2 * US, 72, 80, true));
    expect(p.keadaan).toEqual({ bpm: 72, keyakinan: 80, stabil: true });
    expect(p.stabilSelamaS(T0 + 16 * US)).toBe(15);
    p.putus();
    expect(p.stabilSelamaS(T0 + 17 * US)).toBe(0);
    p.tambahMetrik(nadi(T0 + 18 * US, 72, 80, true));
    expect(p.stabilSelamaS(T0 + 20 * US)).toBe(2);
  });

  it("tanpa medan stable: ambang keyakinan config; stable=true dengan keyakinan rendah tidak dikira", () => {
    const p = new PenjejakStabil(app.beats.keyakinan_stabil);
    p.tambahMetrik(nadi(T0, 70, app.beats.keyakinan_stabil));
    expect(p.keadaan.stabil).toBe(true);
    p.tambahMetrik(nadi(T0 + US, 70, 5, true));
    expect(p.keadaan.stabil).toBe(false);
  });

  it("sim mencapai stabil dalam beberapa saat (Sedia boleh dibuka dalam LIHAT)", () => {
    const { penjana } = larianSim({}, 0);
    const p = new PenjejakStabil(app.beats.keyakinan_stabil);
    for (const m of penjana.jana(20)) p.tambahMetrik(m);
    expect(p.stabilSelamaS(T0 + 20 * US)).toBeGreaterThanOrEqual(app.aliran.lihat_sedia_selepas_stabil_s);
  });
});

describe("garis masa + ayat pendedahan", () => {
  const d = (t: number, ragu = false): Degupan => ({ t, ragu, jurang: false, bising: false });

  it("kedudukan relatif, degupan ragu atau dalam saat lemah tidak dikira, saat tanpa sampel berlorek", () => {
    const mula = T0;
    const akhir = T0 + 4 * US;
    const s0 = Math.floor(T0 / US);
    const kualiti = new Map([
      [s0, 1],
      [s0 + 1, 0.2],
      [s0 + 2, 0.9],
    ]);
    const g = garisMasa({
      mula,
      akhir,
      degupan: [d(T0 - US), d(T0 + 0.5 * US), d(T0 + 1.5 * US), d(T0 + 2.5 * US, true), d(T0 + 5 * US)],
      ketukan: [T0 + US, T0 + 9 * US],
      kualitiSaat: kualiti,
      kualitiSaatMin: app.rasa.kualiti_saat_min,
    });
    expect(g.degupan).toEqual([
      { x: 0.125, dikira: true },
      { x: 0.375, dikira: false },
      { x: 0.625, dikira: false },
    ]);
    expect(g.ketukan).toEqual([0.25]);
    expect(g.kualiti.map((q) => q.rendah)).toEqual([false, true, false, true]);
    expect(g.kualiti.reduce((a, q) => a + q.w, 0)).toBeCloseTo(1);
  });

  it("tetingkap kosong tidak membahagi dengan sifar", () => {
    expect(garisMasa({ mula: T0, akhir: T0, degupan: [], ketukan: [], kualitiSaat: new Map(), kualitiSaatMin: 0.5 }).kualiti).toEqual([]);
  });

  it("ayat: sefasa → bukan kebetulan + sesaran; tiada ketukan → tak cukup dengan sebab; semua kunci wujud BM + EN", () => {
    const { pengesan, benar } = larianSim({}, 62);
    const mula = T0 + 20 * US;
    const akhir = mula + 40 * US;
    const skor = (ketukan: number[]) =>
      kiraSkor(
        {
          degupan: pengesan.degupan(),
          ketukan,
          mula,
          akhir,
          kualitiTetingkap: pengesan.kualitiAntara(mula, akhir),
          kualitiPada: (t) => pengesan.kualitiPada(t),
        },
        app.rasa as KonfigSkor,
      );
    const sefasa = ayatDedah(skor(benar.filter((t) => t >= mula && t < akhir).map((t) => t + 150_000)));
    expect(sefasa.map((a) => a.kunci)).toEqual(["rasa.kiraan", "dedah.sama", "dedah.bukan_kebetulan", "dedah.sesaran"]);
    const tersebar = ayatDedah({ ...skor(benar.filter((t) => t >= mula && t < akhir).map((t) => t + 150_000)), jalur: "meneka" });
    expect(tersebar.map((a) => a.kunci)).toEqual(["rasa.kiraan", "dedah.sama", "dedah.kebetulan"]);
    const kosong = ayatDedah(skor([]));
    expect(kosong.map((a) => a.kunci)).toEqual(["rasa.kiraan", "rasa.tak_cukup", "dedah.sebab_ketukan"]);
    for (const a of [...sefasa, ...kosong]) {
      expect(typeof dapat(ms, a.kunci)).toBe("string");
      expect(typeof dapat(en, a.kunci)).toBe("string");
    }
  });
});
