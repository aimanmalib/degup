import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import config from "../config/app.json";
import { pemegang, ratakan } from "./lang-util";

const muat = (b: string) => ratakan(JSON.parse(readFileSync(`lang/${b}.json`, "utf8")));

describe("pariti lang (BM + EN dari hari pertama)", () => {
  const ms = muat("ms");
  const en = muat("en");

  it("kunci sama dalam ms dan en", () => {
    expect(Object.keys(en).sort()).toEqual(Object.keys(ms).sort());
  });

  it("tiada teks kosong", () => {
    for (const [k, v] of [...Object.entries(ms), ...Object.entries(en)]) expect(v.trim(), k).not.toBe("");
  });

  it("pemegang tempat {x} sama dalam kedua-dua bahasa", () => {
    for (const k of Object.keys(ms)) expect(pemegang(en[k] ?? ""), k).toEqual(pemegang(ms[k] ?? ""));
  });

  it("setiap bahasa dalam config ada fail lang", () => {
    for (const b of config.bahasa) expect(() => muat(b)).not.toThrow();
  });

  it("izin ada tujuh perkara (PRD §4.6)", () => {
    for (const n of [1, 2, 3, 4, 5, 6, 7]) expect(ms).toHaveProperty([`izin.perkara.${n}.teks`]);
  });

  it("setiap jalur RASA dalam config ada label", () => {
    for (const j of config.rasa.jalur) expect(ms).toHaveProperty([`rasa.jalur.${j.id}`]);
  });
});
