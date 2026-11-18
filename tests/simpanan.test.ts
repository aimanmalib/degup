// Simpanan proses main (PRD §4.6 perkara 4, §4.7): kunci tidak pernah teks biasa, tetapan rosak tidak menjatuhkan app, padam semua.
import { mkdtempSync, readFileSync, rmSync, writeFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { Simpanan, gabungTetapan, pilihBahasa, tetapanLalai, type Penyulit } from "../src/main/simpanan.js";

const LALAI = tetapanLalai("ms", true);
const BAHASA = ["ms", "en"];
const xor = (b: Buffer) => Buffer.from(b.map((x) => x ^ 0x5a));
const penyulit = (boleh: boolean): Penyulit => ({
  boleh: () => boleh,
  sulit: (t) => xor(Buffer.from(t)),
  buka: (b) => xor(b).toString(),
});

let folder = "";
const baharu = (boleh = true) => {
  folder = mkdtempSync(join(tmpdir(), "degup-simpanan-"));
  return new Simpanan(folder, LALAI, BAHASA, penyulit(boleh));
};
afterEach(() => rmSync(folder, { recursive: true, force: true }));

describe("Simpanan", () => {
  it("menyimpan kunci tersulit dan membacanya semula; fail tiada teks biasa", () => {
    const s = baharu();
    expect(s.simpanKunci("  kunci-rahsia-xyz  ")).toEqual({ ok: true });
    expect(readFileSync(join(folder, "kunci.bin")).includes(Buffer.from("kunci-rahsia-xyz"))).toBe(false);
    expect(s.bacaKunci()).toBe("kunci-rahsia-xyz");
    expect(s.kunciAda()).toBe(true);
  });

  it("menolak bila storan terenkripsi tiada, dan tidak menulis apa-apa", () => {
    const s = baharu(false);
    expect(s.simpanKunci("abc")).toEqual({ ok: false, sebab: "storan" });
    expect(existsSync(join(folder, "kunci.bin"))).toBe(false);
    expect(s.failDitulis()).toEqual([]);
  });

  it("menolak kunci kosong", () => {
    expect(baharu().simpanKunci("   ")).toEqual({ ok: false, sebab: "kosong" });
  });

  it("tetapan rosak atau berjenis salah jatuh ke lalai medan demi medan", () => {
    const s = baharu();
    writeFileSync(join(folder, "tetapan.json"), "{ bukan json");
    expect(s.bacaTetapan()).toEqual(LALAI);
    expect(gabungTetapan(LALAI, { bahasa: "fr", bunyi: false, sumber: "sim", kamera: 3 }, BAHASA)).toEqual({ ...LALAI, bunyi: false });
  });

  it("merekod fail ditulis sesi ini, dan padam semua membuang setiap fail Degup", () => {
    const s = baharu();
    s.simpanTetapan({ bahasa: "en" });
    s.simpanKunci("k");
    expect(s.failDitulis()).toEqual(["kunci.bin", "tetapan.json"]);
    expect(s.bacaTetapan().bahasa).toBe("en");
    expect(s.padamSemua().sort()).toEqual(["kunci.bin", "tetapan.json"]);
    expect(s.failDitulis()).toEqual([]);
    expect(s.kunciAda()).toBe(false);
    expect(s.bacaTetapan()).toEqual(LALAI);
  });
});

describe("bahasa permulaan (PH§5.2 J2.5)", () => {
  it("auto: locale OS bermula ms → ms; selainnya bahasa undur", () => {
    for (const l of ["ms", "ms-MY", "ms_MY", "MS-my"]) expect(pilihBahasa("auto", l, BAHASA, "en")).toBe("ms");
    for (const l of ["en-US", "en-GB", "id-ID", "fr", "", "msx"]) expect(pilihBahasa("auto", l, BAHASA, "en")).toBe("en");
    expect(pilihBahasa("auto", "id-ID", BAHASA, "ms")).toBe("ms");
  });

  it("kod tetap dihormati; kod tiada dalam senarai = undur", () => {
    expect(pilihBahasa("ms", "en-US", BAHASA, "en")).toBe("ms");
    expect(pilihBahasa("fr", "ms-MY", BAHASA, "en")).toBe("en");
  });

  it("tetapan tersimpan pengguna menang atas lalai locale", () => {
    const lalai = tetapanLalai(pilihBahasa("auto", "en-US", BAHASA, "en"), true);
    expect(gabungTetapan(lalai, { bahasa: "ms" }, BAHASA).bahasa).toBe("ms");
  });

  it("tetapan tidak lagi membawa medan sejarah (J2.7: tiada ciri yang menulis skor)", () => {
    expect(Object.keys(gabungTetapan(LALAI, { sejarah: true }, BAHASA))).not.toContain("sejarah");
  });
});
