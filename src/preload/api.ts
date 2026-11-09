// Kontrak jambatan preload ↔ renderer (contextBridge). Jenis sahaja; dikongsi main, preload, renderer.

export type SumberTetapan = "live" | "replay";

export interface Tetapan {
  bahasa: string;
  /** deviceId kamera dari enumerateDevices; null = lalai sistem. */
  kamera: string | null;
  sejarah: boolean;
  bunyi: boolean;
  sumber: SumberTetapan;
  /** Nama fail fixture (tanpa laluan) bila sumber = replay. */
  fixture: string | null;
}

export interface FixtureSedia {
  fail: string;
  label: string;
  jenis: string;
  tarikh: string;
}

export interface Permulaan {
  tetapan: Tetapan;
  versi: string;
  /** Nilai DEGUP_SUMBER bila ditetapkan (live | replay | sim); menindih tetapan. */
  sumberEnv: string | null;
  fixtures: FixtureSedia[];
  kunciAda: boolean;
  failDitulis: string[];
}

export type HasilKunci = { ok: true } | { ok: false; sebab: "kosong" | "storan" };

export interface DegupApi {
  mula(): Promise<Permulaan>;
  simpanTetapan(ubah: Partial<Tetapan>): Promise<Tetapan>;
  simpanKunci(kunci: string): Promise<HasilKunci>;
  padamKunci(): Promise<void>;
  padamSemua(): Promise<string[]>;
  failDitulis(): Promise<string[]>;
  bukaPautan(id: string): Promise<void>;
}

export const SALURAN = {
  mula: "degup:mula",
  simpanTetapan: "degup:simpan-tetapan",
  simpanKunci: "degup:simpan-kunci",
  padamKunci: "degup:padam-kunci",
  padamSemua: "degup:padam-semua",
  failDitulis: "degup:fail-ditulis",
  bukaPautan: "degup:buka-pautan",
} as const;
