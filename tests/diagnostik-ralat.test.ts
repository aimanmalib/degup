// PH§5.6 L1: diagnostik sentuhan pertama. Ringkasan ralat (nama, kod, baris pertama, laluan rumah `~`, kunci ditapis, dipotong),
// peristiwa log baharu (kamera_gagal, mula_gagal, ralat_ui, ralat + mesej), pemuat SDK tiruan gaya Windows → log tanpa laluan rumah.
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import app from "../config/app.json";
import en from "../lang/en.json";
import ms from "../lang/ms.json";
import { gantiRumah, potong, ringkasRalat, sahkanDiag } from "../src/core/diagnostik";
import { LogDiagnostik } from "../src/main/log";
import { PengikatSdk } from "../src/main/sdk";

const KUNCI = "pk_ujian_9f8e7d6c5b4a3210";
const RUMAH_WIN = "C:\\Users\\Aiman Malib";
const KEPALA = { versi: "1.0.0", komit_kit: "abc1234", os: "win32", os_versi: "10.0", arch: "x64", electron: "45", sumber: "tetapan", sdk: "3.4.0", izin_kamera: "denied" };
const folder: string[] = [];
afterEach(() => {
  for (const f of folder.splice(0)) rmSync(f, { recursive: true, force: true });
});

/** Ralat gaya Windows: `process.dlopen` gagal memuat smartspectra_capi.dll (laluan \\?\ dengan folder rumah). */
function ralatDlopen(): Error {
  const e = new Error(
    `The specified module could not be found.\r\n\\\\?\\${RUMAH_WIN}\\Desktop\\degup-kit\\node_modules\\@smartspectra\\node-sdk-win32-x64\\smartspectra_capi.dll`,
  ) as Error & { code: string };
  e.code = "ERR_DLOPEN_FAILED";
  return e;
}

describe("ringkasRalat / gantiRumah / potong", () => {
  it("nama + kod + baris pertama; baris seterusnya (timbunan, laluan) dibuang", () => {
    expect(ringkasRalat(ralatDlopen(), 300)).toBe("Error [ERR_DLOPEN_FAILED]: The specified module could not be found.");
    const d = Object.assign(new Error("Could not start video source"), { name: "NotReadableError" });
    expect(ringkasRalat(d, 300)).toBe("NotReadableError: Could not start video source");
    expect(ringkasRalat("baris satu\nbaris dua", 300)).toBe("baris satu");
    expect(ringkasRalat(undefined, 300)).toBe("");
    expect(ringkasRalat({ name: "NotFoundError" }, 300)).toBe("NotFoundError");
  });

  it("laluan rumah → ~ (Windows dengan ruang, \\\\?\\, JSON berganda, macOS, Linux, rumah yang diberi)", () => {
    expect(gantiRumah(`\\\\?\\${RUMAH_WIN}\\Desktop\\x.dll`)).toBe("\\\\?\\~\\Desktop\\x.dll");
    expect(gantiRumah("c:\\\\users\\\\aiman\\\\x")).toBe("~\\\\x");
    expect(gantiRumah("D:/Users/aiman/kit/x.so")).toBe("~/kit/x.so");
    expect(gantiRumah("/Users/aiman/Library/x.dylib and /home/claude/degup/a.so, /root/x")).toBe("~/Library/x.dylib and ~/degup/a.so, ~/x");
    expect(gantiRumah("/srv/data/aiman/x", ["/srv/data/aiman"])).toBe("~/x");
    expect(gantiRumah("C:\\Program Files\\Degup\\x.dll")).toBe("C:\\Program Files\\Degup\\x.dll");
  });

  it("kunci ditapis dan had dipatuhi (elipsis dalam had)", () => {
    expect(ringkasRalat(new Error(`bad key ${KUNCI}`), 300, [], [KUNCI])).toBe("Error: bad key [redacted]");
    const r = ringkasRalat(new Error("x".repeat(500)), 160);
    expect(r).toHaveLength(160);
    expect(r.endsWith("…")).toBe(true);
    expect(potong("abc", 3)).toBe("abc");
    expect(potong("abcd", 1)).toBe("a");
  });
});

describe("sahkanDiag: peristiwa L1", () => {
  it("kamera_gagal, mula_gagal, ralat_ui, ralat + mesej: dipotong mesej_maks, laluan rumah ~, medan lain dibuang", () => {
    const panjang = `${"y".repeat(400)}`;
    expect(sahkanDiag({ jenis: "kamera_gagal", nama: "NotAllowedError", mesej: "Permission denied", imej: "data:" }, app.log)).toEqual({
      jenis: "kamera_gagal",
      nama: "NotAllowedError",
      mesej: "Permission denied",
    });
    const m = sahkanDiag({ jenis: "mula_gagal", sebab: "sdk", mesej: `Error: ${RUMAH_WIN}\\a.dll\nstack` }, app.log);
    expect(m).toEqual({ jenis: "mula_gagal", sebab: "sdk", mesej: "Error: ~\\a.dll" });
    expect(sahkanDiag({ jenis: "mula_gagal", sebab: "kunci" }, app.log)).toEqual({ jenis: "mula_gagal", sebab: "kunci", mesej: null });
    const u = sahkanDiag({ jenis: "ralat_ui", asal: "janji", mesej: panjang }, app.log) as { mesej: string };
    expect(u.mesej).toHaveLength(app.log.mesej_maks);
    expect(sahkanDiag({ jenis: "ralat", kod: 6, boleh_ulang: true, mesej: "/home/x/y" }, app.log, ["/home/x"])).toEqual({
      jenis: "ralat",
      kod: 6,
      boleh_ulang: true,
      mesej: "~/y",
    });
  });

  it("menolak bentuk tidak sah", () => {
    for (const x of [{ jenis: "kamera_gagal", nama: "X" }, { jenis: "kamera_gagal", mesej: "m" }, { jenis: "mula_gagal", sebab: 1 },
      { jenis: "ralat_ui", asal: "lain", mesej: "m" }, { jenis: "ralat_ui", asal: "error" }])
      expect(sahkanDiag(x, app.log)).toBeNull();
  });
});

describe("pemuat SDK tiruan gagal gaya Windows → sdk_sedia + log tanpa laluan rumah", () => {
  it("PengikatSdk pulang ralat ringkas; baris log membawa mesej, TIADA folder rumah, TIADA kunci", () => {
    const pengikat = new PengikatSdk<object>(
      () => {
        throw ralatDlopen();
      },
      () => KUNCI,
      () => {},
      (e, k) => ringkasRalat(e, app.log.ralat_maks, [RUMAH_WIN], [k]),
    );
    const h = pengikat.sedia({});
    expect(h).toEqual({ ok: false, sebab: "sdk", ralat: "Error [ERR_DLOPEN_FAILED]: The specified module could not be found." });

    // Mesej satu baris yang memetik laluan (cth resolve-native SDK): laluan rumah jadi ~.
    const dua = new PengikatSdk<object>(
      () => {
        throw new Error(`@smartspectra/node-sdk: SMARTSPECTRA_CAPI_PATH=${RUMAH_WIN}\\kit\\smartspectra_capi.dll points at a file that does not exist.`);
      },
      () => KUNCI,
      () => {},
      (e, k) => ringkasRalat(e, app.log.ralat_maks, [], [k]),
    ).sedia({});
    expect(dua.ok).toBe(false);

    const akar = mkdtempSync(join(tmpdir(), "degup-l1-"));
    folder.push(akar);
    const log = new LogDiagnostik(() => akar, app.log, () => KEPALA, () => [KUNCI]);
    for (const x of [h, dua]) if (!x.ok) log.tulis({ jenis: "sdk_sedia", ok: false, sebab: x.sebab, ralat: x.ralat ?? null });
    const teks = readFileSync(log.laluan(), "utf8");
    const baris = teks.trim().split("\n").map((x) => JSON.parse(x));
    expect(baris[0]).toMatchObject({ jenis: "app", sdk: "3.4.0", izin_kamera: "denied" });
    expect(baris[1].ralat).toContain("The specified module could not be found.");
    expect(baris[2].ralat).toContain("SMARTSPECTRA_CAPI_PATH=~\\kit\\smartspectra_capi.dll");
    expect(teks).not.toMatch(/Aiman|Users/i);
    expect(teks).not.toContain(KUNCI);
  });
});

describe("config + lang L1", () => {
  it("setiap kunci lang kamera_ralat wujud dalam BM + EN; had dalam config", () => {
    const peta = app.kamera_ralat as Record<string, string>;
    for (const [nama, kunci] of Object.entries(peta)) {
      if (nama.startsWith("_")) continue;
      const [kump, k] = kunci.split(".") as [string, string];
      expect((en as unknown as Record<string, Record<string, string>>)[kump]?.[k], kunci).toBeTruthy();
      expect((ms as unknown as Record<string, Record<string, string>>)[kump]?.[k], kunci).toBeTruthy();
    }
    expect(app.log.butiran_maks).toBeLessThanOrEqual(app.log.mesej_maks);
    expect(app.log.mesej_maks).toBeLessThanOrEqual(app.log.ralat_maks);
    expect(app.log.ralat_ui_maks).toBeGreaterThan(0);
    expect(en.umum.butiran).toContain("{x}");
    expect(ms.umum.butiran).toContain("{x}");
  });
});
