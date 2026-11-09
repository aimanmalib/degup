// Simpan kad PNG (main, PRD §4.2): hanya PNG sah, had saiz, nama dari main, tulis atomik.
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { namaKad, pngSah, simpanKad } from "../src/main/kad.js";

const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2, 3]);
const KINI = new Date(2026, 10, 9, 21, 5, 7);
let folder = "";
afterEach(() => {
  if (folder) rmSync(folder, { recursive: true, force: true });
  folder = "";
});
const baharu = () => (folder = mkdtempSync(join(tmpdir(), "degup-kad-")));

describe("simpanKad", () => {
  it("menulis PNG sah dengan nama bermasa dalam folder (dicipta bila tiada)", () => {
    const f = join(baharu(), "Degup");
    const h = simpanKad(f, "degup-kad-", PNG, 100, KINI);
    expect(h).toEqual({ ok: true, nama: "degup-kad-20261109-210507.png", laluan: join(f, "degup-kad-20261109-210507.png") });
    expect(new Uint8Array(readFileSync(join(f, "degup-kad-20261109-210507.png")))).toEqual(PNG);
    expect(readdirSync(f)).toEqual(["degup-kad-20261109-210507.png"]);
  });

  it("dua simpanan dalam saat yang sama tidak menindih: nama kedua berakhiran -2", () => {
    const f = baharu();
    const a = simpanKad(f, "k-", PNG, 100, KINI);
    const b = simpanKad(f, "k-", PNG, 100, KINI);
    expect(a.ok && b.ok && [a.nama, b.nama]).toEqual(["k-20261109-210507.png", "k-20261109-210507-2.png"]);
    expect(readdirSync(f).sort()).toEqual(["k-20261109-210507-2.png", "k-20261109-210507.png"]);
  });

  it("menolak bukan PNG, bukan bait, dan melebihi had; tiada fail ditulis", () => {
    const f = join(baharu(), "Degup");
    expect(simpanKad(f, "x-", new Uint8Array([1, 2, 3]), 100, KINI)).toEqual({ ok: false, sebab: "bukan_png" });
    expect(simpanKad(f, "x-", "iVBOR", 100, KINI)).toEqual({ ok: false, sebab: "bukan_png" });
    expect(simpanKad(f, "x-", PNG, PNG.length - 1, KINI)).toEqual({ ok: false, sebab: "terlalu_besar" });
    expect(existsSync(f)).toBe(false);
  });

  it("pngSah dan namaKad", () => {
    expect(pngSah(PNG.slice(0, 8))).toBe(false);
    expect(namaKad("a-", new Date(2026, 0, 2, 3, 4, 5))).toBe("a-20260102-030405.png");
  });
});
