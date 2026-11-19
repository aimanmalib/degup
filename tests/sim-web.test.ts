// J8: halaman Simulation pelayar (docs/sim/). Jambatan pelayar `src/web/api-pelayar.ts` + bundel dalam repo = binaan dari sumber, tanpa SDK.
import { describe, expect, it } from "vitest";
import konfig from "../config/app.json";
import { ciptaApiPelayar, namaKad, skalaDariCarian, type KonfigPelayar, type PersekitaranPelayar } from "../src/web/api-pelayar.js";
// @ts-expect-error skrip .mjs tanpa jenis
import { beza, binaSimWeb } from "../scripts/bina-sim-web.mjs";

const K: KonfigPelayar = {
  bahasa_lalai: "auto",
  bahasa_undur: "en",
  bahasa: ["ms", "en"],
  bunyi_lalai: true,
  kunci_storan: "uji-tetapan",
  param_skala: "skala",
  awalan_kad: "kad-",
  pautan: { repo: "https://contoh.test/repo", jahat: "javascript:alert(1)" },
};

function persekitaran(carian = "", locale = "ms-MY") {
  const data = new Map<string, string>();
  const muat: Array<{ nama: string; n: number }> = [];
  const dibuka: string[] = [];
  const p: PersekitaranPelayar = {
    storan: { getItem: (k) => data.get(k) ?? null, setItem: (k, v) => void data.set(k, v), removeItem: (k) => void data.delete(k) },
    locale,
    carian,
    versi: "9.9.9",
    kini: () => new Date(2026, 10, 21, 9, 5, 7),
    muatTurun: (nama, b) => void muat.push({ nama, n: b.length }),
    buka: (u) => void dibuka.push(u),
  };
  return { p, data, muat, dibuka };
}

describe("jambatan pelayar", () => {
  it("mula: sumber sentiasa sim, tiada kunci, tiada fixture, bahasa dari locale", async () => {
    const m = await ciptaApiPelayar(K, persekitaran("", "ms-MY").p).mula();
    expect(m).toMatchObject({ sumberEnv: "sim", kunciAda: false, fixtures: [], skalaMasa: 1, versi: "9.9.9", failDitulis: [] });
    expect(m.tetapan.bahasa).toBe("ms");
    expect((await ciptaApiPelayar(K, persekitaran("", "fr-FR").p).mula()).tetapan.bahasa).toBe("en");
  });

  it("skala masa URL hanya 0 < x ≤ 1", () => {
    expect(skalaDariCarian("?skala=0.1", "skala")).toBe(0.1);
    for (const c of ["", "?skala=0", "?skala=2", "?skala=-1", "?skala=abc"]) expect(skalaDariCarian(c, "skala")).toBe(1);
  });

  it("tetapan disimpan dalam storan, medan salah dibuang, kekal selepas muat semula", async () => {
    const e = persekitaran();
    const t = await ciptaApiPelayar(K, e.p).simpanTetapan({ bahasa: "en", bunyi: false, sumber: "sim" as never });
    expect(t).toMatchObject({ bahasa: "en", bunyi: false, sumber: "live" });
    expect((await ciptaApiPelayar(K, e.p).mula()).tetapan.bahasa).toBe("en");
    e.data.set(K.kunci_storan, "{rosak");
    expect((await ciptaApiPelayar(K, e.p).mula()).tetapan.bahasa).toBe("ms");
  });

  it("kunci API tidak pernah disimpan; live ditolak; rakaman dan fixture ditolak", async () => {
    const e = persekitaran();
    const api = ciptaApiPelayar(K, e.p);
    expect(await api.simpanKunci("rahsia-ujian")).toEqual({ ok: false, sebab: "storan" });
    expect([...e.data.values()].join("")).not.toContain("rahsia-ujian");
    expect(await api.sediaLive()).toEqual({ ok: false, sebab: "sdk" });
    expect(await api.rakamMula()).toEqual({ ok: false });
    expect(await api.simpanFixture({})).toEqual({ ok: false });
    expect(await api.bacaFixture("x.json")).toBeNull();
  });

  it("kad dimuat turun dengan nama corak app; buka folder = muat turun semula; padam semua mengosongkan", async () => {
    const e = persekitaran();
    const api = ciptaApiPelayar(K, e.p);
    expect(await api.simpanKad(new Uint8Array())).toEqual({ ok: false });
    expect(await api.simpanKad(new Uint8Array([1, 2, 3]))).toEqual({ ok: true, nama: "kad-20261121-090507.png" });
    await api.bukaFolderKad();
    expect(e.muat).toEqual([{ nama: "kad-20261121-090507.png", n: 3 }, { nama: "kad-20261121-090507.png", n: 3 }]);
    expect(await api.failDitulis()).toEqual(["kad-20261121-090507.png"]);
    await api.simpanTetapan({ bunyi: false });
    expect(await api.padamSemua()).toEqual(["kad-20261121-090507.png"]);
    expect(e.data.size).toBe(0);
    expect(await api.failDitulis()).toEqual([]);
  });

  it("pautan: hanya id config dengan https", async () => {
    const e = persekitaran();
    const api = ciptaApiPelayar(K, e.p);
    for (const id of ["repo", "jahat", "tiada"]) await api.bukaPautan(id);
    expect(e.dibuka).toEqual(["https://contoh.test/repo"]);
  });

  it("namaKad memadankan corak kad app", () => {
    expect(namaKad(konfig.kad.awalan_fail, new Date(2026, 0, 2, 3, 4, 5))).toMatch(/^degup-kad-20260102-030405\.png$/);
  });
});

describe("bundel docs/sim", () => {
  it("fail dalam repo sama dengan binaan dari sumber dan tiada kod SDK", async () => {
    const { folder, fail } = await binaSimWeb();
    expect(beza(folder, fail)).toEqual([]);
    const js = fail["app.min.js"].toString("utf8");
    for (const x of ["__smartspectraBridge", "SmartSpectraSDK", "decodeMetrics", "requestInsight", "node-sdk/renderer"]) expect(js).not.toContain(x);
    expect(fail["index.html"].toString("utf8")).toContain(`<title>${konfig.sim_web.tajuk}</title>`);
  }, 30_000);
});
