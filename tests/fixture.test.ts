import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import app from "../config/app.json";
import { PengesanDegupan, type KonfigBeats } from "../src/core/beats";
import { fixtureKeMetrik, masaMula, PengumpulFixture, sahkanFixture, type Fixture } from "../src/core/fixture";
import { kiraLentur, type KonfigLentur } from "../src/core/rsa";
import { kiraSkor, type KonfigSkor } from "../src/core/score";
import { SumberReplay } from "../src/sumber/replay";
import { janaFixtureSim, type JanaSimContoh } from "../src/sumber/sim-fixture";
import type { KonfigSim } from "../src/sumber/sim";
import type { MetrikSdk } from "../src/core/metrik";

const SKEMA = app.replay.skema;
const STABIL = app.beats.keyakinan_stabil;
const contoh = JSON.parse(readFileSync(app.replay.contoh, "utf8")) as Fixture;
const salin = <T>(x: T): T => structuredClone(x);

describe("fixture contoh (PRD §4.10)", () => {
  it("lulus pengesah, berlabel simulasi, ada babak", () => {
    const h = sahkanFixture(contoh, SKEMA);
    expect(h.ok ? [] : h.ralat).toEqual([]);
    expect(contoh.meta.jenis).toBe("simulasi");
    expect(Object.keys(contoh.meta.babak ?? {}).sort()).toEqual(["lentur", "lihat", "rasa"]);
    expect(contoh.ketukan.length).toBeGreaterThanOrEqual(app.rasa.n_min);
    expect(contoh.prq.length).toBeGreaterThan(0);
  });

  it("dijana semula sama tepat dari meta.jana (deterministik)", () => {
    const j = contoh.meta.jana!;
    const semula = janaFixtureSim(j as unknown as KonfigSim, j as unknown as JanaSimContoh, contoh.meta.skema, contoh.meta.label);
    expect(semula).toEqual(contoh);
  });

  it("main semula melalui pengesan → RASA Selaras, LENTUR ada ringkasan", () => {
    const pengesan = new PengesanDegupan(app.beats as KonfigBeats);
    const nafas: { t: number; v: number; stabil: boolean }[] = [];
    const prq: { v: number; stabil: boolean }[] = [];
    for (const { m } of fixtureKeMetrik(contoh, app.replay.kelompok_ms, STABIL)) {
      pengesan.tambahMetrik(m);
      for (const u of m.breathing?.upperTrace ?? []) nafas.push({ t: Number(u.timestamp), v: u.value!, stabil: !!u.stable });
      const q = m.pulse?.pulseRespirationQuotient;
      for (const u of Array.isArray(q) ? q : []) prq.push({ v: u.value!, stabil: !!u.stable });
    }
    const t0 = masaMula(contoh);
    const [rm, ra] = contoh.meta.babak!.rasa!;
    const skor = kiraSkor(
      {
        degupan: pengesan.degupan(), ketukan: contoh.ketukan, mula: t0 + rm * 1e6, akhir: t0 + ra * 1e6,
        kualitiTetingkap: pengesan.kualitiAntara(t0 + rm * 1e6, t0 + ra * 1e6), kualitiPada: (t) => pengesan.kualitiPada(t),
      },
      app.rasa as KonfigSkor,
    );
    expect(skor.jalur).toBe("selaras");
    const [lm, la] = contoh.meta.babak!.lentur!;
    const lentur = kiraLentur(
      {
        degupan: pengesan.degupan(), kualitiPada: (t) => pengesan.kualitiPada(t), kualitiSaatMin: app.rasa.kualiti_saat_min,
        mula: t0 + lm * 1e6, akhir: t0 + la * 1e6, nafas, prq,
      },
      app.lentur as KonfigLentur,
    );
    expect(lentur.ringkasanMs).toBeGreaterThan(0);
    expect(lentur.prq).not.toBeNull();
  });

  it("pengumpul: fixture → payload → fixture sama", () => {
    const k = new PengumpulFixture();
    for (const { m } of fixtureKeMetrik(contoh, app.replay.kelompok_ms, STABIL)) k.tambahMetrik(m);
    for (const t of contoh.ketukan) k.tambahKetukan(t);
    const semula = k.keFixture(contoh.meta);
    expect(semula.jejak).toEqual(contoh.jejak);
    expect(semula.nadi).toEqual(contoh.nadi);
    expect(semula.nafas).toEqual(contoh.nafas);
    expect(semula.prq).toEqual(contoh.prq);
    expect(semula.ketukan).toEqual(contoh.ketukan);
  });
});

describe("pengesah fixture menolak", () => {
  const kes: [string, (f: Record<string, any>) => void, RegExp][] = [
    ["kunci asing di akar (cth imej)", (f) => (f.imej = "data:image/png;base64,AAAA"), /kunci asing "imej"/],
    ["rentetan dalam data", (f) => (f.jejak[0].v = "1"), /jejak\[0\]\.v/],
    ["kunci asing dalam titik", (f) => (f.nafas[0].bingkai = 1), /kunci asing "bingkai"/],
    ["masa tidak menaik", (f) => (f.jejak[1].t = f.jejak[0].t - 1), /tidak menaik/],
    ["keyakinan luar julat", (f) => (f.nadi[0].c = 101), /luar 0–100/],
    ["skema lain", (f) => (f.meta.skema = SKEMA + 1), /meta\.skema/],
    ["jenis tidak dikenali", (f) => (f.meta.jenis = "rawak"), /meta\.jenis/],
    ["tarikh bukan ISO", (f) => (f.meta.tarikh = "18 Nov"), /meta\.tarikh/],
    ["babak terbalik", (f) => (f.meta.babak.rasa = [70, 30]), /meta\.babak\.rasa/],
    ["ketukan bukan nombor", (f) => (f.ketukan = ["x"]), /ketukan/],
    ["jejak kosong", (f) => (f.jejak = []), /jejak: kosong/],
  ];
  for (const [nama, rosak, ralat] of kes)
    it(nama, () => {
      const f = salin(contoh) as unknown as Record<string, any>;
      rosak(f);
      const h = sahkanFixture(f, SKEMA);
      expect(h.ok).toBe(false);
      if (!h.ok) expect(h.ralat.join("\n")).toMatch(ralat);
    });
  it("bukan objek", () => expect(sahkanFixture([], SKEMA).ok).toBe(false));
});

describe("SumberReplay", () => {
  it("menghantar kelompok ikut jam dengan cap masa dianjak, kemudian bermula semula dari jam semasa", async () => {
    let jam = 5_000_000_000_000_000;
    const r = new SumberReplay(contoh, { kelompok_ms: app.replay.kelompok_ms, keyakinan_stabil: STABIL }, () => jam);
    const diterima: MetrikSdk[] = [];
    r.onMetrik((m) => diterima.push(m));
    const mulaJam = jam;
    await r.mula();
    r.pam();
    expect(diterima).toHaveLength(0);
    jam += 1e6;
    r.pam();
    const n1 = diterima.length;
    expect(n1).toBeGreaterThan(0);
    const t = Number(diterima[0]!.cardio!.arterialPressureTrace![0]!.timestamp);
    expect(t).toBe(contoh.jejak[0]!.t - masaMula(contoh) + mulaJam);
    expect(r.ketukanDianjak()[0]).toBe(contoh.ketukan[0]! - masaMula(contoh) + mulaJam);
    expect(r.masaRelatif(30)).toBe(mulaJam + 30e6);
    jam += 1e9;
    r.pam();
    expect(r.pusingan()).toBe(1);
    const jejakSemua = () => diterima.flatMap((m) => m.cardio?.arterialPressureTrace ?? []);
    expect(jejakSemua()).toHaveLength(contoh.jejak.length);
    const tAkhir = Number(jejakSemua().at(-1)!.timestamp);
    // Pusingan kedua: sampel pertama dianjak ke jam semasa, cap masa terus menaik (pengesan tidak nampak masa mundur).
    jam += 1e6;
    r.pam();
    const kedua = jejakSemua().slice(contoh.jejak.length);
    expect(kedua.length).toBeGreaterThan(0);
    expect(Number(kedua[0]!.timestamp)).toBeGreaterThan(tAkhir);
    expect(r.pusingan()).toBe(1);
    await r.henti();
  });
});
