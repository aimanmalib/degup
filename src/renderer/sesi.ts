// Sesi ukur renderer: SATU sumber (live | replay | sim) → pengesan degupan, penjejak nadi, penjejak jeda petunjuk.
// Babak (LIHAT, RASA, pendedahan) melanggan di sini; satu pendengar metrik sahaja dipasang pada sumber (perangkap SDK).
// Live + `config.rakam_fixture`: angka sesi dikumpul untuk perakam fixture (§4.10; tiada imej).
import { PengesanDegupan, type Degupan } from "../core/beats.js";
import { ringkasRalat } from "../core/diagnostik.js";
import { babakRelatif, masaMula, PengumpulFixture, sahkanFixture, type Fixture } from "../core/fixture.js";
import { PengumpulLentur } from "../core/lentur.js";
import type { MetrikSdk } from "../core/metrik.js";
import { PenjejakJeda } from "../core/petunjuk.js";
import { PenjejakStabil } from "../core/stabil.js";
import type { Sumber } from "../sumber/jenis.js";
import { opsyenSdk, SumberLive, type RalatLive } from "../sumber/live.js";
import { SumberReplay } from "../sumber/replay.js";
import { SumberSim } from "../sumber/sim.js";
import type { Keadaan } from "./keadaan.js";
import { kilangSdk } from "./sdk-live.js";

/**
 * Sumber live tidak dapat dimulakan: tiada kunci, SDK gagal dimuat, atau ralat SDK semasa mula. `butiran` = ringkasan ralat
 * asal (nama + baris pertama, laluan rumah `~`, kunci ditapis) untuk baris Butiran skrin izin dan log; null = tiada.
 */
export class RalatMulaLive extends Error {
  constructor(
    readonly sebab: RalatLive,
    readonly butiran: string | null = null,
  ) {
    super(sebab);
  }
}

export type NamaBabakUkur = "lihat" | "rasa" | "lentur";

/** Masa sekarang µs epoch, asas sama dengan cap masa SDK (PRD §4.2). */
export function kiniUs(): number {
  return (performance.timeOrigin + performance.now()) * 1000;
}

/** Cap masa peristiwa input (µs epoch); `timeStamp` = masa peristiwa berlaku, bukan masa pengendali berjalan. */
export function masaPeristiwaUs(e: Event): number {
  return (performance.timeOrigin + e.timeStamp) * 1000;
}

/** Tetingkap RASA yang sedang berjalan (cangkuk ujian sim menyuntik ketukan melaluinya). */
export interface TetingkapRasa {
  mula: number;
  ketuk(t: number): void;
}

async function buatSumber(k: Keadaan, strim: MediaStream | null): Promise<Sumber | null> {
  if (k.sumber === "live") {
    const s = await k.api.sediaLive();
    if (!s.ok) throw new RalatMulaLive(s.sebab, s.ralat ?? null);
    return new SumberLive(kilangSdk, opsyenSdk(s.kunci, k.konfig.sdk, kilangSdk.kumpulan), strim, k.konfig.log.mesej_maks);
  }
  if (k.sumber === "sim") return new SumberSim(k.konfig.sim);
  if (k.sumber === "replay") {
    const fail = k.tetapan.fixture ?? k.mula.fixtures[0]?.fail;
    const data = fail ? await k.api.bacaFixture(fail) : null;
    const sah = data ? sahkanFixture(data, k.konfig.replay.skema) : null;
    if (!sah?.ok) return null;
    return new SumberReplay(sah.fixture, { kelompok_ms: k.konfig.replay.kelompok_ms, keyakinan_stabil: k.konfig.beats.keyakinan_stabil });
  }
  return null;
}

export class SesiUkur {
  readonly pengesan: PengesanDegupan;
  readonly nadi: PenjejakStabil;
  readonly jeda: PenjejakJeda;
  /** Nafas, PRQ dan nadi untuk LENTUR + kad keputusan. */
  readonly lentur: PengumpulLentur;
  /** Masa sesi dicipta (µs epoch): nadi purata keputusan dikira dari sini. */
  readonly mulaUs = kiniUs();
  rasa: TetingkapRasa | null = null;
  /** Perakam fixture (live + config.rakam_fixture); null = tidak merakam. */
  readonly rakaman: PengumpulFixture | null;
  /** Masa babak µs epoch [mula, akhir) untuk `meta.babak` fixture. */
  private readonly babakUs: Partial<Record<NamaBabakUkur, [number, number]>> = {};
  private babakKini: NamaBabakUkur | null = null;
  private readonly dengarDegupan = new Set<(d: Degupan) => void>();
  private readonly dengarJeda = new Set<() => void>();
  private lepas: Array<() => void> = [];
  /** Cap SDK petunjuk terakhir + jam renderer ketika itu: `detik` mengunjur masa SDK bila tiada kod baharu. */
  private petunjukAkhir: { t: number; dinding: number } | null = null;

  private constructor(
    private readonly k: Keadaan,
    readonly sumber: Sumber | null,
  ) {
    this.pengesan = new PengesanDegupan(k.konfig.beats);
    this.nadi = new PenjejakStabil(k.konfig.beats.keyakinan_stabil);
    this.lentur = new PengumpulLentur(k.konfig.beats.keyakinan_stabil, k.konfig.lentur.simpan_s);
    const { aliran, petunjuk } = k.konfig;
    this.jeda = new PenjejakJeda({
      ...petunjuk,
      jeda_selepas_bukan_ok_s: k.masaS(aliran.jeda_selepas_bukan_ok_s),
      sambung_selepas_ok_s: k.masaS(aliran.sambung_selepas_ok_s),
      tukar_teks_min_s: k.masaS(petunjuk.tukar_teks_min_s),
    });
    this.rakaman = k.konfig.rakam_fixture && sumber?.jenis === "live" ? new PengumpulFixture() : null;
  }

  /**
   * @param strim kamera (live sahaja). @param ralat ralat SDK selepas mula (kunci ditolak, kredit habis): app berhenti + memaparkan.
   * Mula gagal = `RalatMulaLive`; sumber sudah dihentikan.
   */
  static async cipta(
    k: Keadaan,
    strim: MediaStream | null = null,
    ralat: (r: RalatLive, butiran: string | null) => void = () => {},
  ): Promise<SesiUkur> {
    k.api.diag({ jenis: "sesi", fasa: "mula", sumber: k.sumber });
    const s = new SesiUkur(k, await buatSumber(k, strim));
    if (s.sumber) {
      s.lepas.push(s.sumber.onMetrik((m) => s.terimaMetrik(m)));
      s.lepas.push(s.sumber.onPetunjuk((kod, t) => s.terimaPetunjuk(kod, t)));
      const detik = setInterval(() => s.detikPetunjuk(), k.konfig.lihat.kemas_ms);
      s.lepas.push(() => clearInterval(detik));
      if (s.sumber instanceof SumberLive) {
        const live = s.sumber;
        s.lepas.push(live.onRalat(ralat));
        s.lepas.push(live.onDiag((p) => k.api.diag(p)));
        s.lepas.push(
          live.onKiraan((c) => {
            k.sesi.pengesahan = c.pengesahan;
            k.sesi.insight = c.insight;
          }),
        );
      }
      try {
        await s.sumber.mula();
      } catch (e) {
        await s.henti();
        if (e instanceof RalatMulaLive) throw e;
        throw new RalatMulaLive("sdk", s.sumber instanceof SumberLive ? s.sumber.ringkas(e) : ringkasRalat(e, k.konfig.log.mesej_maks));
      }
    }
    return s;
  }

  /** Tanda babak bermula (dan tutup babak sebelumnya) untuk `meta.babak` fixture. */
  tandaBabak(nama: NamaBabakUkur | null): void {
    const kini = kiniUs();
    if (this.babakKini) this.babakUs[this.babakKini]![1] = kini;
    this.babakKini = nama;
    if (nama) this.babakUs[nama] = [kini, kini];
  }

  /** Fixture angka sesi ini (perakam §4.10). null = tidak merakam / tiada jejak. */
  fixtureRakaman(ketukan: number[], skema: number, label: string, tarikh: string): Fixture | null {
    if (!this.rakaman) return null;
    this.tandaBabak(null);
    for (const t of ketukan) this.rakaman.tambahKetukan(t);
    const f = this.rakaman.keFixture({ skema, jenis: "ujian", label, tarikh });
    if (f.jejak.length === 0) return null;
    const babak = babakRelatif(this.babakUs, masaMula(f));
    if (babak) f.meta.babak = babak;
    return f;
  }

  private terimaMetrik(m: MetrikSdk): void {
    this.rakaman?.tambahMetrik(m);
    // Dalam jeda nadi tidak disuap: kiraan "Sedia" bermula semula selepas sambung (putus dipanggil sekali, bila jeda bermula).
    if (!this.jeda.dijeda) this.nadi.tambahMetrik(m);
    this.lentur.tambahMetrik(m);
    for (const d of this.pengesan.tambahMetrik(m)) for (const f of this.dengarDegupan) f(d);
  }

  terimaPetunjuk(kod: number, t: number): void {
    this.petunjukAkhir = { t, dinding: kiniUs() };
    this.selepasJeda(this.jeda.dijeda, this.jeda.kemas(kod, t));
  }

  /** Histeresis jeda bergantung masa: majukan dengan masa SDK yang diunjur dari kod terakhir (tiada kod = tiada apa). */
  private detikPetunjuk(): void {
    const a = this.petunjukAkhir;
    if (!a) return;
    const dijeda = this.jeda.dijeda;
    this.selepasJeda(dijeda, this.jeda.detik(a.t + (kiniUs() - a.dinding)));
  }

  private selepasJeda(dahulu: boolean, berubah: boolean): void {
    if (!berubah) return;
    if (!dahulu && this.jeda.dijeda) this.nadi.putus();
    for (const f of this.dengarJeda) f();
  }

  /** Ujian sim: petunjuk SDK tiruan. Sumber lain mengabaikannya. */
  suntikPetunjuk(kod: number): void {
    if (this.sumber instanceof SumberSim) this.sumber.suntikPetunjuk(kod);
  }

  onDegupan(f: (d: Degupan) => void): () => void {
    this.dengarDegupan.add(f);
    return () => this.dengarDegupan.delete(f);
  }

  onJeda(f: () => void): () => void {
    this.dengarJeda.add(f);
    return () => this.dengarJeda.delete(f);
  }

  async henti(): Promise<void> {
    if (this.lepas.length) this.k.api.diag({ jenis: "sesi", fasa: "tamat", sumber: this.k.sumber });
    for (const f of this.lepas) f();
    this.lepas = [];
    this.dengarDegupan.clear();
    this.dengarJeda.clear();
    await this.sumber?.henti();
  }
}
