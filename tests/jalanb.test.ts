// K3 (PH§5.5): jentera jalan B. Pengesan permulaan bunyi atas klip sintetik dengan ketukan pada saat diketahui (ralat ≤
// ralat_maks_ms, tiada ketukan palsu daripada hingar latar), rancangan ketukan lawan babak, dan bahan pemegang tempat.
// Ujian ffmpeg (klip `-f lavfi` dalam mktemp, dibuang) dilangkau bila ffmpeg tiada (pelari CI); PCM JS sentiasa berjalan.
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import jb from "../config/jalanb.json";
import {
  argMjpeg,
  grafAudioPemegangTempat,
  kesanKetukan,
  masaPemegangTempat,
  padanKetukan,
  rancangKetukan,
  type KonfigKetukan,
} from "../src/alat/jalanb";

const K = jb.ketukan as KonfigKetukan;
const SR = K.kadar_sampel;
const HAD_S = jb.ketukan.ralat_maks_ms / 1000;

/** PRNG tetap (mulberry32) supaya hingar sama setiap larian. */
function rawak(benih: number) {
  let a = benih >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function klip(tempohS: number, ketukan: number[], o: { hingar: number; letus?: Array<[number, number, number]>; amp?: number }) {
  const x = new Float32Array(Math.round(tempohS * SR));
  const r = rawak(42);
  for (let i = 0; i < x.length; i++) x[i] = (r() * 2 - 1) * o.hingar * Math.sqrt(3);
  for (const [mula, tempoh, amp] of o.letus ?? []) // hingar lebih kuat (bilik, nafas) tetapi tanpa permulaan tajam
    for (let i = Math.round(mula * SR); i < Math.min(x.length, Math.round((mula + tempoh) * SR)); i++) {
      const sampul = Math.sin((Math.PI * (i / SR - mula)) / tempoh);
      x[i]! += (r() * 2 - 1) * amp * sampul;
    }
  for (const t of ketukan)
    for (let j = 0; j < 0.06 * SR; j++) {
      const i = Math.round(t * SR) + j;
      if (i < x.length) x[i]! += (o.amp ?? 0.5) * Math.sin(2 * Math.PI * 1400 * (j / SR)) * Math.exp(-70 * (j / SR));
    }
  return x;
}

const KP = { ...K, julat_s: undefined };

describe("kesanKetukan: klip sintetik", () => {
  const diketahui = Array.from({ length: 40 }, (_, i) => 1.3 + i * 0.83 + ((i * 0.618) % 1) * 0.2);

  it("setiap ketukan dikesan dalam ralat_maks_ms, tiada palsu, atas hingar putih + letusan", () => {
    const x = klip(38, diketahui, { hingar: 0.02, letus: [[5, 0.8, 0.2], [20.5, 1.2, 0.25], [33, 0.8, 0.2]] });
    const h = kesanKetukan(x, KP);
    const p = padanKetukan(diketahui, h.ketukan_s, HAD_S);
    expect(p).toMatchObject({ padan: diketahui.length, terlepas: 0, palsu: 0 });
    expect(p.ralat_maks_ms).toBeLessThanOrEqual(jb.ketukan.ralat_maks_ms);
  });

  it("ketukan perlahan (amp 0.08) di atas hingar masih dikesan", () => {
    const x = klip(38, diketahui, { hingar: 0.01, amp: 0.08 });
    const p = padanKetukan(diketahui, kesanKetukan(x, KP).ketukan_s, HAD_S);
    expect(p).toMatchObject({ terlepas: 0, palsu: 0 });
  });

  it("hingar sahaja (dengan letusan) = tiada ketukan", () => {
    const x = klip(30, [], { hingar: 0.02, letus: [[3, 1, 0.2], [12, 2, 0.3], [25, 0.8, 0.2]] });
    expect(kesanKetukan(x, KP).ketukan_s).toEqual([]);
  });

  it("senyap mutlak = tiada ketukan; julat_s membuang ketukan di luar tetingkap", () => {
    expect(kesanKetukan(new Float32Array(SR * 5), KP).ketukan_s).toEqual([]);
    const x = klip(38, diketahui, { hingar: 0.02 });
    const h = kesanKetukan(x, { ...K, julat_s: [10, 20] });
    expect(h.ketukan_s.length).toBe(diketahui.filter((t) => t >= 10 && t <= 20).length);
    expect(h.ketukan_s.every((t) => t >= 10 && t <= 20)).toBe(true);
  });

  it("dua ketukan lebih rapat daripada refraktori dikira satu", () => {
    const x = klip(4, [1, 1 + K.refraktori_ms / 2000, 2.5], { hingar: 0.01 });
    expect(kesanKetukan(x, KP).ketukan_s).toHaveLength(2);
  });
});

describe("rancangan dan padanan", () => {
  it("rancangKetukan: hanya ketukan dalam [mula, tamat) dimainkan", () => {
    expect(rancangKetukan([59, 60, 61.5, 99.9, 100, 104], 60, 100)).toEqual({ main: [60, 61.5, 99.9], awal: 1, lewat: 2 });
  });
  it("padanKetukan: terlepas, palsu dan ralat bertanda", () => {
    const p = padanKetukan([1, 2, 3], [1.01, 2.5, 3], 0.03);
    expect(p).toMatchObject({ padan: 2, terlepas: 1, palsu: 1 });
    expect(p.ralat_ms[0]).toBeCloseTo(10, 5);
  });
});

describe("pemegang tempat dan kamera palsu", () => {
  const pt = jb.pemegang_tempat;
  it("masa ketukan dalam tetingkap babak RASA, tidak berkala sempurna, lebih jarak daripada refraktori", () => {
    const t = masaPemegangTempat(pt);
    expect(t[0]).toBe(pt.ketukan_mula_s);
    expect(t.at(-1)!).toBeLessThanOrEqual(pt.ketukan_akhir_s);
    const selang = t.slice(1).map((v, i) => v - t[i]!);
    expect(Math.min(...selang) * 1000).toBeGreaterThan(K.refraktori_ms);
    expect(new Set(selang.map((s) => s.toFixed(3))).size).toBeGreaterThan(3);
    expect(t[0]).toBeGreaterThanOrEqual(jb.babak.lihat_tamat_s);
  });
  it("graf audio: satu sebutan if(between) setiap ketukan dalam pokok lt(), tiga input amix", () => {
    const g = grafAudioPemegangTempat(pt, [63, 61.2, 62], 16000);
    expect(g.match(/if\(between/g)).toHaveLength(3);
    expect(g.match(/if\(lt\(t,/g)).toHaveLength(2);
    expect(g).toContain("amix=inputs=3");
  });
  it("argumen MJPEG: tiada audio, saiz dan fps dari config", () => {
    const a = argMjpeg("a.mp4", "b.mjpeg", jb.kamera);
    expect(a).toContain("-an");
    expect(a.join(" ")).toContain(`fps=${jb.kamera.fps}`);
    expect(a.join(" ")).toContain(`scale=${jb.kamera.lebar}:${jb.kamera.tinggi}`);
    expect(a.at(-1)).toBe("b.mjpeg");
  });
});

const adaFfmpeg = spawnSync("ffmpeg", ["-version"]).status === 0;

describe.skipIf(!adaFfmpeg)("ffmpeg -f lavfi: klip pemegang tempat sebenar", () => {
  it("trek audio pemegang tempat → ketukan dikesan dalam ralat_maks_ms, tiada palsu", () => {
    const pt = { ...jb.pemegang_tempat, tempoh_s: 75, ketukan_mula_s: 61.2, ketukan_akhir_s: 72, letus_mula_s: [20, 66] };
    const diketahui = masaPemegangTempat(pt);
    const d = mkdtempSync(join(tmpdir(), "degup-jalanb-uji-"));
    try {
      const f = join(d, "a.wav");
      execFileSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-f", "lavfi", "-i", grafAudioPemegangTempat(pt, diketahui, SR).replace(/\[a\]$/, "[out0]"), "-ac", "1", f]);
      const pcm = execFileSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-i", f, "-af", jb.ketukan.penapis_ffmpeg, "-ac", "1", "-ar", String(SR), "-f", "f32le", "-"], {
        maxBuffer: 64 << 20,
      });
      const x = new Float32Array(pcm.buffer, pcm.byteOffset, pcm.byteLength / 4);
      const p = padanKetukan(diketahui, kesanKetukan(x, K).ketukan_s, HAD_S);
      expect(p).toMatchObject({ padan: diketahui.length, terlepas: 0, palsu: 0 });
      expect(p.ralat_maks_ms).toBeLessThanOrEqual(jb.ketukan.ralat_maks_ms);
    } finally {
      rmSync(d, { recursive: true, force: true });
    }
  }, 60_000);
});
