import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import dasar from "./kata-larangan.json";
import { ratakan } from "./lang-util";

type SenaraiBenar = Record<string, string[]>;

const lepas = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const corak = (kata: string) => new RegExp(`(^|[^\\p{L}\\p{N}])${lepas(kata)}($|[^\\p{L}\\p{N}])`, "iu");

/** Perkataan larangan yang muncul dalam teks, tolak yang dibenarkan untuk konteks itu. */
export function langgar(teks: string, kata: string[], benar: string[] = []): string[] {
  const b = new Set(benar.map((x) => x.toLowerCase()));
  return kata.filter((k) => !b.has(k.toLowerCase()) && corak(k).test(teks));
}

/** Pelanggaran dalam satu fail lang (kunci rata → teks). */
export function semakLang(kunci: Record<string, string>, kata: string[], benar: SenaraiBenar): string[] {
  return Object.entries(kunci).flatMap(([k, v]) => langgar(v, kata, benar[k]).map((x) => `${k}: ${x}`));
}

/** Markdown: hanya blok <!-- izin mula --> … <!-- izin akhir --> boleh memakai markdown_izin. */
export function semakMarkdown(teks: string, kata: string[], izin: string[]): string[] {
  const blok = /<!-- izin mula -->([\s\S]*?)<!-- izin akhir -->/g;
  const luar = teks.replace(blok, " ");
  const dalam = [...teks.matchAll(blok)].map((m) => m[1] ?? "").join("\n");
  return [...langgar(luar, kata), ...langgar(dalam, kata, izin).map((x) => `blok izin: ${x}`)];
}

const kata: string[] = dasar.kata;
const benar: SenaraiBenar = dasar.senarai_benar;

describe("kata larangan (PRD §4.8)", () => {
  for (const bahasa of ["ms", "en"]) {
    it(`lang/${bahasa}.json bersih di luar kunci senarai benar`, () => {
      const kunci = ratakan(JSON.parse(readFileSync(`lang/${bahasa}.json`, "utf8")));
      expect(semakLang(kunci, kata, benar)).toEqual([]);
    });
  }

  it("setiap kunci senarai benar wujud dalam kedua-dua fail lang", () => {
    for (const bahasa of ["ms", "en"]) {
      const kunci = ratakan(JSON.parse(readFileSync(`lang/${bahasa}.json`, "utf8")));
      for (const k of Object.keys(benar)) expect(kunci, `${bahasa}: ${k}`).toHaveProperty([k]);
    }
  });

  for (const fail of dasar.fail_markdown) {
    it(`${fail} bersih`, () => {
      if (!existsSync(fail)) return;
      expect(semakMarkdown(readFileSync(fail, "utf8"), kata, dasar.markdown_izin)).toEqual([]);
    });
  }

  it("senarai benar SEMPIT: perkataan sama di kunci lain ditolak", () => {
    expect(semakLang({ "lihat.arahan": "No stress here" }, kata, benar)).toEqual(["lihat.arahan: stress"]);
    expect(semakLang({ "izin.perkara.3.teks": "pulse, HRV" }, kata, benar)).toEqual([]);
    expect(semakLang({ "izin.perkara.3.teks": "HRV and medical" }, kata, benar)).toEqual(["izin.perkara.3.teks: medical"]);
    expect(semakLang({ "lentur.ringkasan": "aritmia" }, kata, benar)).toEqual(["lentur.ringkasan: aritmia"]);
  });

  it("padanan pada sempadan perkataan, tanpa kira huruf besar", () => {
    expect(langgar("Stressful", ["stress"])).toEqual([]);
    expect(langgar("no STRESS.", ["stress"])).toEqual(["stress"]);
    expect(langgar("Runs 100% on-device", kata)).toContain("100% on-device");
  });

  it("markdown: perkataan di luar blok izin ditolak, di dalam blok dibenarkan", () => {
    const md = "Intro\n<!-- izin mula -->\nNot a medical device.\n<!-- izin akhir -->\nOutro medical";
    expect(semakMarkdown(md, kata, dasar.markdown_izin)).toEqual(["medical"]);
    expect(semakMarkdown("<!-- izin mula -->stress<!-- izin akhir -->", kata, dasar.markdown_izin)).toEqual(["blok izin: stress"]);
  });
});
