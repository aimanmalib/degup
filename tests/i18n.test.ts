import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import app from "../config/app.json";
import { I18n, isi, pemegang, ratakan } from "../src/core/i18n";

const lang = Object.fromEntries(app.bahasa.map((b) => [b, JSON.parse(readFileSync(`lang/${b}.json`, "utf8"))]));

describe("i18n teras", () => {
  const mainan = { ms: { a: { b: "Hai {nama}" }, hanya_ms: "x" }, en: { a: { b: "Hi {nama}" }, hanya_en: "y" } };

  it("teks ikut bahasa, tukar bahasa, isi pemegang", () => {
    const i = new I18n(mainan, "ms", "en");
    expect(i.t("a.b", { nama: "Ali" })).toBe("Hai Ali");
    i.tukar("en");
    expect(i.bahasa).toBe("en");
    expect(i.t("a.b", { nama: 3 })).toBe("Hi 3");
  });

  it("sandaran bila kunci tiada; kunci tiada di mana-mana = kunci", () => {
    const i = new I18n(mainan, "ms", "en");
    expect(i.t("hanya_en")).toBe("y");
    expect(i.ada("hanya_en")).toBe(true);
    expect(i.t("tiada.kunci")).toBe("tiada.kunci");
    expect(i.ada("tiada.kunci")).toBe(false);
  });

  it("bahasa tidak dikenali = ralat", () => {
    expect(() => new I18n(mainan, "fr", "en")).toThrow();
    expect(() => new I18n(mainan, "ms", "en").tukar("fr")).toThrow();
  });

  it("isi membiarkan pemegang tanpa nilai; pemegang disenarai tersusun", () => {
    expect(isi("{a} dan {b}", { a: 1 })).toBe("1 dan {b}");
    expect(pemegang("{z} {a}")).toEqual(["a", "z"]);
    expect(() => ratakan({ a: 1 })).toThrow();
  });

  it("fail lang sebenar: setiap kunci BM wujud dalam setiap bahasa tanpa sandaran", () => {
    const ms = ratakan(lang.ms);
    for (const b of app.bahasa) {
      const i = new I18n(lang, b, b);
      for (const k of Object.keys(ms)) expect(i.t(k), `${b}:${k}`).not.toBe(k);
    }
  });
});
