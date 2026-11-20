// Log diagnostik kit + tetingkap rakaman + tindihan config kit (PELAN J6a, D22). Tiada Electron, tiada SDK: folder sementara sahaja.
import { mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import app from "../config/app.json";
import kit from "../config/kit.json";
import { barisLog, namaFailLog, sahkanDiag, saizRakam, TapisUlang, tapisRahsia } from "../src/core/diagnostik";
import { bacaKomitKit, LogDiagnostik } from "../src/main/log";
// @ts-expect-error modul .mjs tanpa jenis (skrip kit)
import { gabung } from "../scripts/kit/gabung-config.mjs";

const KUNCI = "pk_ujian_9f8e7d6c5b4a3210";
const KEPALA = { versi: "1.0.0", komit_kit: "abc1234", os: "win32", os_versi: "10.0", arch: "x64", electron: "45", sumber: "tetapan", sdk: "3.4.0", izin_kamera: "granted" };
const HAD = app.log;
const folder: string[] = [];
const baharu = () => {
  const f = mkdtempSync(join(tmpdir(), "degup-log-"));
  folder.push(f);
  return f;
};
afterEach(() => {
  for (const f of folder.splice(0)) rmSync(f, { recursive: true, force: true });
});

describe("sahkanDiag", () => {
  it("menerima bentuk yang dibenarkan sahaja dan membuang medan lain (kunci, imej)", () => {
    expect(sahkanDiag({ jenis: "status", kod: 3, apiKey: KUNCI }, HAD)).toEqual({ jenis: "status", kod: 3 });
    expect(sahkanDiag({ jenis: "kamera", label: "x".repeat(500), lebar: 1280, tinggi: 720, fps: 30, imej: "data:" }, HAD)).toEqual({
      jenis: "kamera",
      label: "x".repeat(120),
      lebar: 1280,
      tinggi: 720,
      fps: 30,
    });
    expect(sahkanDiag({ jenis: "ralat", kod: 2, boleh_ulang: "ya" }, HAD)).toEqual({ jenis: "ralat", kod: 2, boleh_ulang: false, mesej: null });
  });

  it("menolak jenis tidak dikenali, jenis main sahaja, dan nombor tidak sah", () => {
    for (const x of [null, "status", { jenis: "kunci", nilai: KUNCI }, { jenis: "sdk_sedia", ok: true }, { jenis: "tetingkap", lebar: 1 },
      { jenis: "status", kod: "3" }, { jenis: "metrik_pertama", ms: Number.NaN }, { jenis: "sesi", fasa: "x", sumber: "live" }])
      expect(sahkanDiag(x, HAD)).toBeNull();
  });
});

describe("tapisRahsia / barisLog / namaFailLog / TapisUlang", () => {
  it("kunci ditapis di mana-mana kedudukan; rahsia pendek atau kosong diabaikan", () => {
    expect(tapisRahsia(`a ${KUNCI} b ${KUNCI}`, [KUNCI, null, "", "ab"])).toBe("a [redacted] b [redacted]");
    const b = barisLog(new Date("2026-11-19T01:02:03Z"), { jenis: "kamera", label: `Cam ${KUNCI}`, lebar: 1, tinggi: 1, fps: 1 }, [KUNCI]);
    expect(b.endsWith("\n")).toBe(true);
    expect(JSON.parse(b)).toMatchObject({ masa: "2026-11-19T01:02:03.000Z", jenis: "kamera", label: "Cam [redacted]" });
  });

  it("nama fail harian ikut tarikh tempatan", () => {
    expect(namaFailLog("degup-", new Date(2026, 10, 9, 23, 59))).toBe("degup-2026-11-09.log");
  });

  it("TapisUlang: kod sama berturut dilangkau, setiap jenis berasingan", () => {
    const t = new TapisUlang();
    expect([t.lulus("a", 1), t.lulus("a", 1), t.lulus("b", 1), t.lulus("a", 2), t.lulus("a", 1)]).toEqual([true, false, true, true, true]);
  });
});

describe("LogDiagnostik", () => {
  it("kepala sekali (versi, komit kit, OS) + satu baris setiap peristiwa; kunci dalam tetapan TIDAK pernah tertulis", () => {
    const akar = baharu();
    const log = new LogDiagnostik(() => akar, app.log, () => KEPALA, () => [KUNCI, undefined], () => new Date(2026, 10, 19, 9));
    log.tulis({ jenis: "sdk_sedia", ok: true, sebab: null, ralat: null });
    log.tulis({ jenis: "kamera", label: `Integrated Camera ${KUNCI}`, lebar: 1280, tinggi: 720, fps: 30 });
    log.tulis({ jenis: "pengesahan", kod: 1 });
    log.tulis({ jenis: "metrik_pertama", ms: 2345 });
    const fail = readdirSync(join(akar, app.log.folder));
    expect(fail).toEqual(["degup-2026-11-19.log"]);
    const teks = readFileSync(join(akar, app.log.folder, fail[0]!), "utf8");
    expect(teks).not.toContain(KUNCI);
    const baris = teks.trim().split("\n").map((x) => JSON.parse(x));
    expect(baris.map((b) => b.jenis)).toEqual(["app", "sdk_sedia", "kamera", "pengesahan", "metrik_pertama"]);
    expect(baris[0]).toMatchObject({ komit_kit: "abc1234", os: "win32", versi: "1.0.0", sdk: "3.4.0", izin_kamera: "granted" });
  });

  it("berhenti menulis bila fail mencapai had saiz; ralat fs ditelan", () => {
    const akar = baharu();
    const log = new LogDiagnostik(() => akar, { ...app.log, maks_bait: 200 }, () => KEPALA, () => []);
    for (let i = 0; i < 20; i++) log.tulis({ jenis: "status", kod: i });
    const saiz = readFileSync(log.laluan(), "utf8").length;
    expect(saiz).toBeLessThan(400);
    const rosak = new LogDiagnostik(() => join(akar, "\0tidak-sah"), app.log, () => KEPALA, () => []);
    expect(() => rosak.tulis({ jenis: "status", kod: 1 })).not.toThrow();
  });

  it("bacaKomitKit: sha dari KIT-COMMIT, tiada atau rosak = dev", () => {
    const akar = baharu();
    expect(bacaKomitKit(join(akar, "KIT-COMMIT"))).toBe("dev");
    writeFileSync(join(akar, "KIT-COMMIT"), "0123456789abcdef0123456789abcdef01234567 v0.9.0\n");
    expect(bacaKomitKit(join(akar, "KIT-COMMIT"))).toBe("0123456789abcdef0123456789abcdef01234567");
    writeFileSync(join(akar, "KIT-COMMIT"), "bukan komit");
    expect(bacaKomitKit(join(akar, "KIT-COMMIT"))).toBe("dev");
  });
});

describe("saizRakam (tetingkap rakaman 16:9)", () => {
  const min = { lebar: app.tetingkap.min_lebar, tinggi: app.tetingkap.min_tinggi };
  it("config: 16:9 dan muat dalam perakam", () => {
    expect(app.tetingkap.rakam.lebar * 9).toBe(app.tetingkap.rakam.tinggi * 16);
    expect(app.tetingkap.rakam.lebar).toBeLessThanOrEqual(app.perakam.lebar);
  });
  it("skrin besar = sasaran tepat; skrin laptop 1366×768 = dikecilkan, nisbah kekal; tidak bawah minimum", () => {
    expect(saizRakam(app.tetingkap.rakam, { lebar: 1920, tinggi: 1040 }, min)).toEqual({ lebar: 1600, tinggi: 900 });
    const kecil = saizRakam(app.tetingkap.rakam, { lebar: 1366, tinggi: 728 - 31 }, min);
    expect(kecil.lebar / kecil.tinggi).toBeCloseTo(16 / 9, 2);
    expect(kecil.tinggi).toBeLessThanOrEqual(697);
    expect(saizRakam(app.tetingkap.rakam, { lebar: 800, tinggi: 500 }, min)).toEqual(min);
  });
});

describe("config kit (tindihan bina-kit.sh)", () => {
  it("bitrate 4 Mbps + perakam fixture hidup dalam kit; lalai repo tidak berubah; nota lain kekal", () => {
    const k = gabung(app, kit);
    expect(k.perakam.bitrate).toBe(4_000_000);
    expect(k.rakam_fixture).toBe(true);
    expect(k.perakam.fps).toBe(app.perakam.fps);
    expect(k._nota).toBe(app._nota);
    expect(app.perakam.bitrate).toBe(8_000_000);
    expect(app.rakam_fixture).toBe(false);
  });
  it("kunci kit salah eja = ralat, bukan senyap", () => {
    expect(() => gabung(app, { perakam: { bitrat: 1 } })).toThrow(/perakam\.bitrat/);
  });
  it("mula.bat: semak Node ≥ 20 dengan pautan nodejs.org, npm ci sekali, npm start; tiada kunci", () => {
    const bat = readFileSync(new URL("../scripts/kit/mula.bat", import.meta.url), "utf8");
    expect(bat).toMatch(/LSS 20/);
    expect(bat).toContain("https://nodejs.org/");
    expect(bat).toMatch(/call npm ci/);
    expect(bat).toMatch(/\.degup-ci-ok/);
    expect(bat).toMatch(/call npm start/);
    expect(bat).not.toMatch(/SMARTSPECTRA_API_KEY/);
  });
});
