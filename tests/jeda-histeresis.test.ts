// K2 (PH§5.5): jeda petunjuk tahan kelipan. Kod dalam config disahkan atas enum `ValidationCode` pakej sebenar;
// jujukan berkelip 200 ms selama 14 s (nasihat: tiada jeda; kritikal: jeda sekali), lubang 17 s ikut `jeda_ulang_pusingan_s`,
// teks petunjuk bertukar paling kerap sekali setiap `tukar_teks_min_s`.
import { ValidationCode } from "@smartspectra/node-sdk";
import { describe, expect, it } from "vitest";
import app from "../config/app.json";
import { KOD_OK, KOD_PETUNJUK, KOD_SDK, namaKodTakDikenali, PenjejakJeda, type KonfigJeda } from "../src/core/petunjuk";
import { T0, US } from "./bantu-sim";

const kfg: KonfigJeda = {
  ...app.petunjuk,
  jeda_selepas_bukan_ok_s: app.aliran.jeda_selepas_bukan_ok_s,
  sambung_selepas_ok_s: app.aliran.sambung_selepas_ok_s,
};
const MS = 1000;
const TIADA_MUKA = ValidationCode.kNoFaceFound;
const GERAK = ValidationCode.kExcessiveMotion;

/** Main jujukan [kod, t] dan pulangkan bilangan jeda bermula + semua kod papar berbeza dengan masa. */
function main(j: PenjejakJeda, langkah: Array<[number, number]>) {
  let jeda = 0;
  let dahulu = j.dijeda;
  const papar: Array<[number, number]> = [];
  for (const [kod, t] of langkah) {
    j.kemas(kod, t);
    if (!dahulu && j.dijeda) jeda++;
    dahulu = j.dijeda;
    if (papar.at(-1)?.[0] !== j.kodPapar) papar.push([j.kodPapar, t]);
  }
  return { jeda, papar };
}

/** OK dan `kod` berselang setiap 200 ms selama `s` saat, kemudian OK berterusan 3 s (detik setiap 100 ms). */
function kelip(kod: number, s: number, mula = T0): Array<[number, number]> {
  const l: Array<[number, number]> = [];
  for (let t = 0; t < s * 1000; t += 100) l.push([Math.floor(t / 200) % 2 === 0 ? kod : KOD_OK, mula + t * MS]);
  for (let t = s * 1000; t < (s + 3) * 1000; t += 100) l.push([KOD_OK, mula + t * MS]);
  return l;
}

describe("kod config = enum ValidationCode pakej 3.4.0", () => {
  it("KOD_SDK sama dengan enum pakej; setiap kod ada kunci lang", () => {
    expect(KOD_SDK).toEqual({ ...ValidationCode });
    expect(Object.values(KOD_SDK).sort((a, b) => a - b)).toEqual(Object.keys(KOD_PETUNJUK).map(Number).sort((a, b) => a - b));
  });

  it("setiap nama kritikal/nasihat dalam config wujud dalam enum, tiada pertindihan, OK tidak dikelas", () => {
    expect(namaKodTakDikenali(app.petunjuk)).toEqual([]);
    for (const n of [...app.petunjuk.kritikal, ...app.petunjuk.nasihat]) expect(ValidationCode).toHaveProperty(n);
    expect(app.petunjuk.kritikal.filter((n) => app.petunjuk.nasihat.includes(n))).toEqual([]);
    expect([...app.petunjuk.kritikal, ...app.petunjuk.nasihat]).not.toContain("kOk");
    expect(namaKodTakDikenali({ kritikal: ["kNoFace"], nasihat: [] })).toEqual(["kNoFace"]);
  });
});

describe("histeresis jeda", () => {
  it("nasihat berkelip 200 ms selama 14 s: tiada jeda; teks bertukar paling kerap sekali sesaat", () => {
    const j = new PenjejakJeda(kfg);
    const { jeda, papar } = main(j, kelip(GERAK, 14));
    expect(jeda).toBe(0);
    expect(j.dijeda).toBe(false);
    expect(papar[0]![0]).toBe(GERAK);
    // Petunjuk tidak berkelip: GERAK kekal sepanjang kelipan, sembunyi sekali selepas OK berterusan.
    expect(papar.map(([k]) => k)).toEqual([GERAK, KOD_OK]);
    for (let i = 1; i < papar.length; i++) expect(papar[i]![1] - papar[i - 1]![1]).toBeGreaterThanOrEqual(kfg.tukar_teks_min_s * US);
  });

  it("kritikal berkelip 200 ms selama 14 s: jeda SEKALI selepas ambang, sambung selepas OK berterusan", () => {
    const j = new PenjejakJeda(kfg);
    let mulaJeda: number | null = null;
    let tamatJeda: number | null = null;
    let n = 0;
    for (const [kod, t] of kelip(TIADA_MUKA, 14)) {
      const dahulu = j.dijeda;
      j.kemas(kod, t);
      if (!dahulu && j.dijeda) (n++, (mulaJeda = t));
      if (dahulu && !j.dijeda) tamatJeda = t;
    }
    expect(n).toBe(1);
    expect(mulaJeda! - T0).toBeGreaterThan(kfg.jeda_selepas_bukan_ok_s * US);
    expect(mulaJeda! - T0).toBeLessThanOrEqual(kfg.jeda_selepas_bukan_ok_s * US + 200 * MS);
    // Kod kritikal terakhir pada 13.8 s; sambung selepas OK berterusan ≥ ambang.
    expect(tamatJeda! - (T0 + 13_800 * MS)).toBeGreaterThanOrEqual(kfg.sambung_selepas_ok_s * US);
    expect(j.dijeda).toBe(false);
  });

  it("kod kritikal tunggal lebih pendek dari ambang tidak menjeda; kod berterusan menjeda tanpa kod baharu (detik)", () => {
    const j = new PenjejakJeda(kfg);
    j.kemas(TIADA_MUKA, T0);
    j.kemas(KOD_OK, T0 + 1_000 * MS);
    j.detik(T0 + 5 * US);
    expect(j.dijeda).toBe(false);
    j.kemas(TIADA_MUKA, T0 + 6 * US);
    expect(j.detik(T0 + 6 * US + kfg.jeda_selepas_bukan_ok_s * US)).toBe(false);
    expect(j.detik(T0 + 6 * US + (kfg.jeda_selepas_bukan_ok_s + 0.1) * US)).toBe(true);
    expect(j.dijeda).toBe(true);
    expect(j.kodPapar).toBe(TIADA_MUKA);
  });

  it("lubang 17 s: jeda sekali; pusingan RASA diulang tepat bila lubang > jeda_ulang_pusingan_s (config)", () => {
    const lubangS = 17;
    const had = app.aliran.jeda_ulang_pusingan_s;
    const j = new PenjejakJeda(kfg);
    j.kemas(KOD_OK, T0);
    const mula = T0 + US;
    let jeda = 0;
    let ulang = false;
    for (let t = 0; t <= lubangS * 1000; t += 100) {
      const dahulu = j.dijeda;
      j.kemas(TIADA_MUKA, mula + t * MS);
      if (!dahulu && j.dijeda) jeda++;
      ulang ||= j.perluUlang(mula + t * MS, had);
    }
    expect(jeda).toBe(1);
    expect(j.tempohUs(mula + lubangS * US)).toBe(lubangS * US);
    expect(ulang).toBe(lubangS > had);
    // Had lebih pendek dari lubang (cth skala ujian) → ulang.
    expect(j.perluUlang(mula + lubangS * US, lubangS - 1)).toBe(true);
    j.kemas(KOD_OK, mula + (lubangS + 0.5) * US);
    expect(j.dijeda).toBe(true);
    j.detik(mula + (lubangS + 0.5 + kfg.sambung_selepas_ok_s) * US);
    expect(j.dijeda).toBe(false);
    expect(j.tempohUs(mula + 30 * US)).toBe(0);
  });

  it("kod tidak dikenali = kritikal; cap masa mundur tidak memundurkan masa", () => {
    const j = new PenjejakJeda(kfg);
    expect(j.kritikal(99)).toBe(true);
    expect(j.kritikal(GERAK)).toBe(false);
    expect(j.kritikal(KOD_OK)).toBe(false);
    j.kemas(99, T0 + 5 * US);
    j.kemas(99, T0);
    j.detik(T0 + 5 * US + (kfg.jeda_selepas_bukan_ok_s + 0.1) * US);
    expect(j.dijeda).toBe(true);
  });
});
