// i18n tulen (PRD §4.8, nilai tetap 1): teks hanya dari `lang/<bahasa>.json`; kod tidak menyimpan teks UI.
// Tiada DOM. Renderer memuat kamus dan memanggil `t(kunci, { x })`.

export type Kamus = Record<string, string>;

/** Ratakan objek lang bersarang kepada kunci bertitik → teks. Nilai bukan rentetan = ralat (fail lang hanya teks). */
export function ratakan(o: unknown, awalan = ""): Kamus {
  const hasil: Kamus = {};
  if (typeof o !== "object" || o === null || Array.isArray(o)) throw new Error(`lang: ${awalan || "(akar)"} bukan objek`);
  for (const [k, v] of Object.entries(o)) {
    const kunci = awalan ? `${awalan}.${k}` : k;
    if (typeof v === "string") hasil[kunci] = v;
    else Object.assign(hasil, ratakan(v, kunci));
  }
  return hasil;
}

/** Nama pemegang tempat {nama} dalam teks, tersusun. */
export const pemegang = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]!).sort();

/** Ganti {nama} dengan nilai; pemegang tanpa nilai dibiarkan supaya kesilapan kelihatan. */
export function isi(teks: string, nilai: Record<string, string | number> = {}): string {
  return teks.replace(/\{(\w+)\}/g, (asal, k: string) => (k in nilai ? String(nilai[k]) : asal));
}

export class I18n {
  private readonly kamus = new Map<string, Kamus>();

  /**
   * @param sumber bahasa → objek lang mentah (dari JSON)
   * @param sandaran bahasa bila kunci tiada dalam bahasa semasa (pariti diuji; ini jaring keselamatan sahaja)
   */
  constructor(
    sumber: Record<string, unknown>,
    private bahasaKini: string,
    private readonly sandaran: string,
  ) {
    for (const [b, o] of Object.entries(sumber)) this.kamus.set(b, ratakan(o));
    if (!this.kamus.has(bahasaKini)) throw new Error(`i18n: bahasa "${bahasaKini}" tiada`);
    if (!this.kamus.has(sandaran)) throw new Error(`i18n: sandaran "${sandaran}" tiada`);
  }

  get bahasa(): string {
    return this.bahasaKini;
  }

  tukar(bahasa: string): void {
    if (!this.kamus.has(bahasa)) throw new Error(`i18n: bahasa "${bahasa}" tiada`);
    this.bahasaKini = bahasa;
  }

  ada(kunci: string): boolean {
    return Object.hasOwn(this.kamus.get(this.bahasaKini)!, kunci) || Object.hasOwn(this.kamus.get(this.sandaran)!, kunci);
  }

  /** Teks untuk kunci; kunci tiada di mana-mana = kunci itu sendiri (kelihatan dalam UI dan ujian). */
  t(kunci: string, nilai?: Record<string, string | number>): string {
    const teks = this.kamus.get(this.bahasaKini)![kunci] ?? this.kamus.get(this.sandaran)![kunci] ?? kunci;
    return isi(teks, nilai);
  }
}
