// Sumber `replay` (PRD §4.10): main semula fixture angka dengan cap masa dianjak ke jam semasa.
// Antara muka sama dengan `sim` dan `live`. Juri tanpa kunci boleh melihat semua babak.
import { fixtureKeMetrik, masaMula, type Fixture } from "../core/fixture.js";
import type { MetrikSdk } from "../core/metrik.js";
import type { Sumber } from "./jenis.js";
import { Pemancar } from "./pemancar.js";

export interface KonfigReplay {
  kelompok_ms: number;
  keyakinan_stabil: number;
}

export class SumberReplay implements Sumber {
  readonly jenis = "replay" as const;
  private readonly metrik = new Pemancar<[MetrikSdk]>();
  private readonly petunjuk = new Pemancar<[number, number]>();
  readonly onMetrik = this.metrik.dengar;
  readonly onPetunjuk = this.petunjuk.dengar;
  private pemasa: ReturnType<typeof setInterval> | null = null;
  private anjakUs = 0;
  private baris: { tAkhir: number; m: MetrikSdk }[] = [];
  private i = 0;

  constructor(
    readonly fixture: Fixture,
    private readonly kfg: KonfigReplay,
    private readonly jam: () => number = () => Date.now() * 1000,
  ) {}

  /** Ujian/demo: petunjuk SDK tiruan (cth 1 = tiada muka, 0 = OK) seolah-olah dari `validationStatus`. */
  suntikPetunjuk(kod: number): void {
    this.petunjuk.pancar(kod, this.jam());
  }

  async mula(): Promise<void> {
    if (this.pemasa) return;
    this.anjakUs = this.jam() - masaMula(this.fixture);
    this.baris = fixtureKeMetrik(this.fixture, this.kfg.kelompok_ms, this.kfg.keyakinan_stabil, this.anjakUs);
    this.i = 0;
    this.pemasa = setInterval(() => this.pam(), this.kfg.kelompok_ms);
  }

  /** Hantar semua kelompok yang sudah "berlaku" mengikut jam. */
  pam(): void {
    const kini = this.jam();
    while (this.i < this.baris.length && this.baris[this.i]!.tAkhir <= kini) this.metrik.pancar(this.baris[this.i++]!.m);
    if (this.selesai()) void this.henti();
  }

  selesai(): boolean {
    return this.baris.length > 0 && this.i >= this.baris.length;
  }

  /** Ketukan dirakam, dianjak ke jam main semula (demo pendedahan tanpa pengguna). */
  ketukanDianjak(): number[] {
    return this.fixture.ketukan.map((t) => t + this.anjakUs);
  }

  /** Masa (µs, jam main semula) bagi saat relatif s dalam fixture — untuk `meta.babak`. */
  masaRelatif(s: number): number {
    return masaMula(this.fixture) + this.anjakUs + s * 1e6;
  }

  async henti(): Promise<void> {
    if (this.pemasa) clearInterval(this.pemasa);
    this.pemasa = null;
  }
}
