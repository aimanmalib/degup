// Penulis log diagnostik setempat (PELAN J6a): `userData/logs/degup-<tarikh>.log`, satu baris JSON setiap peristiwa.
// Kepala sekali setiap proses (versi app, komit kit, OS). Kunci API ditapis walaupun ada dalam tetapan; tiada imej; had saiz fail.
import { appendFileSync, mkdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { barisLog, namaFailLog, type KepalaLog, type PeristiwaDiag } from "../core/diagnostik.js";

export interface KonfigLog {
  folder: string;
  awalan_fail: string;
  maks_bait: number;
}

/** Komit kit dari fail `KIT-COMMIT` (ditulis `scripts/kit/bina-kit.sh`); tiada = "dev" (dijalankan dari klon repo). */
export function bacaKomitKit(laluan: string): string {
  try {
    const k = readFileSync(laluan, "utf8").trim().split(/\s+/)[0] ?? "";
    return /^[0-9a-f]{7,40}$/.test(k) ? k : "dev";
  } catch {
    return "dev";
  }
}

export class LogDiagnostik {
  private kepalaDitulis = false;
  private penuh = false;

  constructor(
    private readonly akar: () => string,
    private readonly k: KonfigLog,
    private readonly kepala: () => KepalaLog,
    /** Rahsia semasa (kunci tersimpan, env): ditapis dari setiap baris. */
    private readonly rahsia: () => ReadonlyArray<string | null | undefined>,
    private readonly kini: () => Date = () => new Date(),
  ) {}

  /** Laluan fail log hari ini. */
  laluan(): string {
    return join(this.akar(), this.k.folder, namaFailLog(this.k.awalan_fail, this.kini()));
  }

  /** Tulis satu peristiwa. Ralat fs ditelan: log tidak pernah menghentikan app. */
  tulis(p: PeristiwaDiag): void {
    if (this.penuh) return;
    try {
      const fail = this.laluan();
      mkdirSync(join(this.akar(), this.k.folder), { recursive: true });
      let saiz = 0;
      try {
        saiz = statSync(fail).size;
      } catch {
        /* fail baharu */
      }
      if (saiz >= this.k.maks_bait) {
        this.penuh = true;
        return;
      }
      const rahsia = this.rahsia();
      let teks = "";
      if (!this.kepalaDitulis) teks += barisLog(this.kini(), { jenis: "app", ...this.kepala() }, rahsia);
      teks += barisLog(this.kini(), p, rahsia);
      appendFileSync(fail, teks, { mode: 0o600 });
      this.kepalaDitulis = true;
    } catch {
      /* cakera penuh / kebenaran: diabaikan */
    }
  }
}
