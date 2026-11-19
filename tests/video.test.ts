// P8a: saluran paip video (src/alat/video.ts). Jadual babak dalam ujian ini = fixture beku berbentuk SKRIP-VIDEO.md (fail itu
// setempat, tiada dalam klon bersih); bila fail setempat wujud, ia juga mesti terhurai.
import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import vid from "../config/video.json";
import {
  bunyiKetukan,
  huraiBabak,
  huraiEbur128,
  huraiLoudnorm,
  huraiMasa,
  isiSlot,
  jadualKapsyen,
  narasiTiruan,
  pecahKapsyen,
  petaKetukan,
  semakPeta,
  semakUkuran,
  slotTbd,
  srt,
  tokenWarna,
  wav,
  type PetaPotong,
} from "../src/alat/video";

const MD = `# Skrip

## Babak (20 s)

| ${vid.jadual.tajuk_lajur_masa} | Di skrin | ${vid.jadual.tajuk_lajur_narasi} |
|---|---|---|
| 0:00–0:08 | Pembuka | "Try to feel your heartbeat. No finger on your wrist." |
| 0:08–0:16 | See | "Twenty squats. <<TBD bpm rehat>> becomes <<TBD bpm selepas>>. The lamp keeps up." |
| 0:16–0:20 | Kad akhir | (tiada) |

Teks selepas jadual.
`;

describe("huraiBabak", () => {
  it("membaca masa, narasi dalam petikan, dan babak tanpa narasi", () => {
    const b = huraiBabak(MD, vid.jadual);
    expect(b.map((x) => [x.mula, x.akhir])).toEqual([[0, 8], [8, 16], [16, 20]]);
    expect(b[0]!.narasi).toBe("Try to feel your heartbeat. No finger on your wrist.");
    expect(b[2]!.narasi).toBeNull();
  });
  it("menolak masa berlubang dan jadual tiada", () => {
    expect(() => huraiBabak(MD.replace("0:08–0:16", "0:09–0:16"), vid.jadual)).toThrow(/tidak bersambung/);
    expect(() => huraiBabak("tiada jadual", vid.jadual)).toThrow(/tiada/);
    expect(() => huraiMasa("1:75")).toThrow();
  });
  it.skipIf(!existsSync("docs/hantar/SKRIP-VIDEO.md"))("skrip setempat: babak bersambung dan tamat ≤ had tempoh", () => {
    const b = huraiBabak(readFileSync("docs/hantar/SKRIP-VIDEO.md", "utf8"), vid.jadual);
    expect(b.at(-1)!.akhir).toBeLessThanOrEqual(vid.had.tempoh_maks_s);
    expect(b.at(-1)!.narasi).toBeNull();
  });
});

describe("slot TBD", () => {
  const b = huraiBabak(MD, vid.jadual);
  it("menyenarai, mengisi dari nilai, dan membiar slot tanpa nilai", () => {
    expect(slotTbd(b)).toEqual(["bpm rehat", "bpm selepas"]);
    const isi = isiSlot(b, { "bpm rehat": "71" });
    expect(isi[1]!.narasi).toContain("71 becomes <<TBD bpm selepas>>");
    expect(slotTbd(isi)).toEqual(["bpm selepas"]);
    expect(slotTbd(isiSlot(b, {}, (n) => `[${n}]`))).toEqual([]);
  });
});

describe("kapsyen", () => {
  it("pil ≤ maks aksara, hujung ayat menamatkan pil", () => {
    const p = pecahKapsyen("Now the lamp goes dark. I press each time I feel a beat, again and again and again.", 24);
    expect(p[0]).toBe("Now the lamp goes dark.");
    for (const x of p) expect(x.length).toBeLessThanOrEqual(24);
    expect(p.join(" ")).toBe("Now the lamp goes dark. I press each time I feel a beat, again and again and again.");
  });
  it("kapsyen dalam tetingkap babak, berturutan, dan SRT bernombor", () => {
    const k = jadualKapsyen(huraiBabak(MD, vid.jadual), vid.kapsyen);
    for (let i = 1; i < k.length; i++) expect(k[i]!.mula).toBeGreaterThanOrEqual(k[i - 1]!.akhir - 1e-9);
    expect(k.every((c) => c.akhir <= 16)).toBe(true);
    const s = srt(k);
    expect(s.startsWith("1\n00:00:00,000 --> 00:00:")).toBe(true);
    expect(s.split("\n\n")).toHaveLength(k.length);
  });
});

describe("peta potong dan ketukan", () => {
  const b = huraiBabak(MD, vid.jadual);
  const T0 = 1_794_225_600_000_000;
  const peta: PetaPotong = {
    sumber: { utama: "a.webm" },
    babak: [{ sumber: "utama", mula: 30 }, { sumber: "utama", mula: 5 }, { kad: true }],
    ketukan: { fixture: "f.json", sumber: "utama", sumber_mula_us: T0 },
  };
  it("peta sah lulus; kad di tengah, sumber tiada, bilangan salah ditolak", () => {
    expect(semakPeta(b, peta)).toEqual([]);
    expect(semakPeta(b, { ...peta, babak: [{ kad: true }, { sumber: "x", mula: 0 }, { kad: true }] })).toHaveLength(2);
    expect(semakPeta(b, { ...peta, babak: peta.babak.slice(1) })[0]).toMatch(/2 babak/);
  });
  it("ketukan dipeta ke setiap babak yang memotong masa sumbernya; di luar potongan dibuang", () => {
    // t sumber 31 s → babak 1 (mula 30) = 1 s; t 6 s → babak 2 (mula 5, video 8) = 9 s; t 20 s → tiada babak.
    const t = petaKetukan(b, peta, [T0 + 31e6, T0 + 6e6, T0 + 20e6]);
    expect(t.map((x) => +x.toFixed(6))).toEqual([1, 9]);
    expect(petaKetukan(b, { ...peta, ketukan: undefined }, [T0])).toEqual([]);
  });
});

describe("audio", () => {
  it("klik hanya pada masa ketukan; narasi tiruan hanya dalam tetingkap kapsyen; WAV 16-bit", () => {
    const k = bunyiKetukan([0.5], 1, 8000, vid.ketukan);
    expect(Math.max(...k.slice(0, 3900).map(Math.abs))).toBe(0);
    expect(Math.max(...k.slice(4000, 4300).map(Math.abs))).toBeGreaterThan(0.1);
    const n = narasiTiruan([{ mula: 0.5, akhir: 0.8, teks: "x" }], 1, 8000, vid.narasi_tiruan);
    expect(Math.max(...n.slice(0, 3990).map(Math.abs))).toBe(0);
    expect(Math.max(...n.slice(6500).map(Math.abs))).toBe(0);
    const w = wav(new Float32Array([0, 2, -2]), 8000);
    expect(w.toString("ascii", 0, 4)).toBe("RIFF");
    expect([w.readInt16LE(44), w.readInt16LE(46), w.readInt16LE(48)]).toEqual([0, 32767, -32767]);
  });
});

describe("ukuran ffmpeg", () => {
  const EBUR = `[Parsed_ebur128_0 @ 0x1] t: 1 M: -20 S: -20 I: -30.0 LUFS\n[Parsed_ebur128_0 @ 0x1] Summary:\n\n  Integrated loudness:\n    I:         -16.4 LUFS\n    Threshold: -26.6 LUFS\n\n  Loudness range:\n    LRA:         3.1 LU\n\n  True peak:\n    Peak:       -2.1 dBFS\n`;
  it("ringkasan ebur128 dan JSON loudnorm terhurai", () => {
    expect(huraiEbur128(EBUR)).toEqual({ lufs: -16.4, tp: -2.1 });
    expect(() => huraiEbur128("tiada")).toThrow();
    expect(huraiLoudnorm(`x\n{\n "input_i" : "-24.10",\n "input_tp" : "-6.00"\n}\n`).input_i).toBe("-24.10");
  });
  it("had tempoh, LUFS dan puncak benar", () => {
    expect(semakUkuran({ tempoh: 120, lufs: -16.5, tp: -2 }, vid.had)).toEqual([]);
    expect(semakUkuran({ tempoh: 121, lufs: -18, tp: -1 }, vid.had)).toHaveLength(3);
  });
  it("token warna dari gaya app", () => {
    expect(tokenWarna(":root{\n  --malam: #0f1626;\n  --malam-2: #000000;\n}", "--malam")).toBe("#0f1626");
    expect(() => tokenWarna("", "--tiada")).toThrow();
  });
});
