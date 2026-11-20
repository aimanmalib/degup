// P3b teras: petunjuk SDK → kunci lang + jeda, penjejak nadi stabil (LIHAT "Sedia"), garis masa + ayat pendedahan.
import { describe, expect, it } from "vitest";
import app from "../config/app.json";
import en from "../lang/en.json";
import ms from "../lang/ms.json";
import type { Degupan } from "../src/core/beats";
import { ayatDedah, ayatSama, garisMasa } from "../src/core/dedah";
import { KOD_PETUNJUK, kunciPetunjuk } from "../src/core/petunjuk";
import { kiraSkor, skorDipapar, type KonfigSkor } from "../src/core/score";
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

  it("ayat: sefasa → makna selaras + sesaran; tiada ketukan → tak cukup dengan sebab; semua kunci wujud BM + EN", () => {
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
    const sefasa = ayatDedah(skor(benar.filter((t) => t >= mula && t < akhir).map((t) => t + 150_000)), app.rasa.liputan);
    expect(sefasa.map((a) => a.kunci)).toEqual(["rasa.kiraan", "dedah.sama", "dedah.makna.selaras", "dedah.sesaran"]);
    // J2.1: ayat "x daripada 10" yang bercanggah dengan jalur tidak dipapar (sefasa x tinggi + jalur meneka = dua ayat bertentangan).
    const bercanggah = ayatDedah({ ...skor(benar.filter((t) => t >= mula && t < akhir).map((t) => t + 150_000)), jalur: "meneka" }, app.rasa.liputan);
    expect(bercanggah.map((a) => a.kunci)).toEqual(["rasa.kiraan", "dedah.makna.meneka"]);
    // K1: 12 ketukan sefasa dalam ±10 s = cukup untuk skor tetapi liputan gagal → ayat terlalu sedikit dengan nombor, tiada "x daripada 10".
    const sedikit = ayatDedah(skor(benar.filter((t) => t >= mula && t < akhir).slice(0, 12).map((t) => t + 150_000)), app.rasa.liputan);
    expect(sedikit.map((a) => a.kunci)).toEqual(["rasa.kiraan", "dedah.makna.terlalu_sedikit"]);
    expect(sedikit[1]!.nilai).toMatchObject({ n: 12, min: app.rasa.liputan.ketukan_min, smin: app.rasa.liputan.rentang_min_s });
    expect(sedikit[1]!.nilai!.s).toBeLessThan(app.rasa.liputan.rentang_min_s);
    // L2: skor yang boleh dipapar = null untuk jalur ini (rupa "Tiada skor", bukan "95 /100" di atas pil).
    const hSedikit = skor(benar.filter((t) => t >= mula && t < akhir).slice(0, 12).map((t) => t + 150_000));
    expect(hSedikit.cukup).toBe(true);
    expect(skorDipapar(hSedikit)).toBeNull();
    expect(skorDipapar(skor(benar.filter((t) => t >= mula && t < akhir).map((t) => t + 150_000)))).toBeGreaterThan(0);
    // L2 (b): satu kiraan — ketukan di luar dua degupan jelas (sebelum degupan pertama) → ayat menyebut kedua-dua nombor.
    const awal = benar.find((t) => t >= mula)! - 50_000;
    const campur = skor([awal, ...benar.filter((t) => t >= mula && t < akhir).slice(0, 12).map((t) => t + 150_000)]);
    expect(campur.n).toBe(campur.nKetukanSah + 1);
    const sebahagian = ayatDedah(campur, app.rasa.liputan);
    expect(sebahagian.map((a) => a.kunci)).toEqual(["rasa.kiraan", "dedah.terlalu_sedikit_sebahagian"]);
    expect(sebahagian[1]!.nilai).toMatchObject({ n: campur.nKetukanSah, jumlah: campur.n });
    for (const b of [ms, en]) expect(dapat(b, "dedah.terlalu_sedikit_sebahagian")).toContain("{jumlah}");
    const kosong = ayatDedah(skor([]), app.rasa.liputan);
    expect(kosong.map((a) => a.kunci)).toEqual(["rasa.kiraan", "rasa.tak_cukup", "dedah.sebab_ketukan"]);
    // J2.2: sebab = ketukan → ayat menyebut ketukan, bukan cahaya; nombor minimum dari config.
    expect(kosong[2]!.nilai).toEqual({ n: 0, min: app.rasa.n_min });
    for (const b of [ms, en]) {
      expect(dapat(b, "rasa.tak_cukup")).not.toMatch(/light|cahaya/i);
      expect(dapat(b, "dedah.sebab_ketukan")).not.toMatch(/light|cahaya/i);
      expect(dapat(b, "dedah.sebab_kualiti")).toMatch(/light|cahaya/i);
    }
    expect(sefasa.find((a) => a.kunci === "dedah.sama")!.nilai).toMatchObject({ a: 2, b: 3 });
    for (const a of [...sefasa, ...kosong, ...sedikit, ...bercanggah]) {
      expect(typeof dapat(ms, a.kunci)).toBe("string");
      expect(typeof dapat(en, a.kunci)).toBe("string");
    }
  });
});

describe("ayat kebetulan (PH§5.2 J2.1)", () => {
  const asas = { samaDaripada10: 0, jalur: "meneka", peluangDaripada10: 10 * 2 * app.rasa.ayat_separuh_kitaran } as never as Parameters<typeof ayatSama>[0];
  const dengan = (x: number, jalur: string) => ayatSama({ ...asas, samaDaripada10: x, jalur });

  it("tetingkap ±0.125 kitaran: kebetulan semata-mata ≈ 2.5 daripada 10 (dahulu ±0.25 = separuh kitaran, 5 daripada 10)", () => {
    expect(app.rasa.ayat_separuh_kitaran).toBe(0.125);
    expect(dengan(8, "selaras")).toEqual({ kunci: "dedah.sama", nilai: { x: 8, a: 2, b: 3 } });
  });

  it("tidak dipapar bersama jalur yang bercanggah", () => {
    expect(dengan(8, "meneka")).toBeNull();
    expect(dengan(3, "meneka")).toEqual({ kunci: "dedah.sama", nilai: { x: 3, a: 2, b: 3 } });
    expect(dengan(3, "ada_rasa")).toBeNull();
    expect(dengan(4, "ada_rasa")).not.toBeNull();
    expect(ayatSama({ ...asas, jalur: null })).toBeNull();
  });

  it("teks BM + EN menyebut paras kebetulan", () => {
    expect(en.dedah.sama).toContain("Chance alone gives about {a} or {b}");
    expect(ms.dedah.sama).toContain("{a} atau {b}");
  });
});

describe("lencana Live dan teks LENTUR (PH§5.2 J2.3, J2.4)", () => {
  it("LENTUR tidak menilai bacaan: tiada 'normal'", () => {
    expect(en.lentur.penerangan).not.toMatch(/normal/i);
    expect(ms.lentur.penerangan).not.toMatch(/normal/i);
    expect(en.lentur.penerangan.startsWith("Most people's hearts do this.")).toBe(true);
  });

  it("lencana Live membawa versi SDK dari config, dan config = pin package.json = pakej terpasang", async () => {
    const { readFileSync } = await import("node:fs");
    const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
    const sdk = JSON.parse(readFileSync(new URL("../node_modules/@smartspectra/node-sdk/package.json", import.meta.url), "utf8"));
    expect(pkg.dependencies[app.sdk.pakej]).toBe(app.sdk.versi);
    expect(sdk.version).toBe(app.sdk.versi);
    expect(en.umum.langsung).toBe("Live · SmartSpectra SDK {versi}");
    expect(ms.umum.langsung).toContain("SmartSpectra SDK {versi}");
  });
});
