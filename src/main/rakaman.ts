// Fail yang perakam tulis (PRD §4.9 perakam demo, §4.10 perakam fixture). Tiada Electron di sini (diuji vitest):
// main memberi folder (Video pengguna / Degup, Dokumen / Degup / fixtures). Renderer menghantar bait/objek; main menamakan fail
// sendiri (renderer tidak memilih laluan), mengehadkan saiz, dan menulis fixture HANYA bila lulus pengesah skema (angka sahaja).
import { appendFileSync, existsSync, mkdirSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { sahkanFixture } from "../core/fixture.js";
import { namaIkutMasa } from "./kad.js";

export type HasilFail = { ok: true; nama: string; laluan: string } | { ok: false };

export interface HadRakaman {
  /** Had satu ketulan `MediaRecorder` (bait). */
  ketul_maks_bait: number;
  /** Had jumlah satu rakaman (bait); melepasi = rakaman ditamatkan. */
  jumlah_maks_bait: number;
}

/** Satu rakaman demo pada satu masa: `<nama>.part` ditambah ketul demi ketul, dinamakan semula `.webm` bila tamat. */
export class PenulisRakaman {
  private aktif: { nama: string; part: string; bait: number } | null = null;

  constructor(
    private readonly folder: () => string,
    private readonly awalan: string,
    private readonly had: HadRakaman,
  ) {}

  get sedangRakam(): boolean {
    return this.aktif !== null;
  }

  mula(kini: Date): HasilFail {
    if (this.aktif) return { ok: false };
    const folder = this.folder();
    try {
      mkdirSync(folder, { recursive: true });
      const nama = namaIkutMasa(this.awalan, kini, "webm", (x) => existsSync(join(folder, x)) || existsSync(join(folder, `.${x}.part`)));
      const part = join(folder, `.${nama}.part`);
      writeFileSync(part, new Uint8Array(0));
      this.aktif = { nama, part, bait: 0 };
      return { ok: true, nama, laluan: join(folder, nama) };
    } catch {
      return { ok: false };
    }
  }

  /** Tambah satu ketul. false = ditolak (bukan bait, terlalu besar, tiada rakaman, had jumlah). */
  tulis(bait: unknown): boolean {
    const a = this.aktif;
    if (!a || !(bait instanceof Uint8Array) || bait.length > this.had.ketul_maks_bait) return false;
    if (a.bait + bait.length > this.had.jumlah_maks_bait) return false;
    try {
      appendFileSync(a.part, bait);
      a.bait += bait.length;
      return true;
    } catch {
      return false;
    }
  }

  /** Tamat: `.part` → `.webm`. Rakaman kosong dibuang (tiada fail sampah). */
  tamat(): HasilFail {
    const a = this.aktif;
    this.aktif = null;
    if (!a) return { ok: false };
    if (a.bait === 0) {
      rmSync(a.part, { force: true });
      return { ok: false };
    }
    const laluan = join(this.folder(), a.nama);
    try {
      renameSync(a.part, laluan);
      return { ok: true, nama: a.nama, laluan };
    } catch {
      return { ok: false };
    }
  }
}

/** Perakam fixture (§4.10): tulis HANYA objek yang lulus pengesah skema P2b (tiada imej, tiada rentetan dalam data). */
export function simpanFixtureRakaman(folder: string, awalan: string, data: unknown, skema: number, kini: Date): HasilFail {
  const sah = sahkanFixture(data, skema);
  if (!sah.ok) return { ok: false };
  try {
    mkdirSync(folder, { recursive: true });
    const nama = namaIkutMasa(awalan, kini, "json", (x) => existsSync(join(folder, x)));
    const laluan = join(folder, nama);
    const tmp = join(folder, `.${nama}.tmp`);
    writeFileSync(tmp, JSON.stringify(sah.fixture));
    renameSync(tmp, laluan);
    return { ok: true, nama, laluan };
  } catch {
    return { ok: false };
  }
}
