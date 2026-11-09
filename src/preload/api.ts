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
  /** Pendarab tempoh babak (ujian, sim/replay sahaja); 1 dalam app sebenar. */
  skalaMasa: number;
  kunciAda: boolean;
  failDitulis: string[];
}

export type HasilSimpanKad = { ok: true; nama: string } | { ok: false };

export type HasilKunci = { ok: true } | { ok: false; sebab: "kosong" | "storan" };

export type HasilSediaLive = { ok: true; kunci: string } | { ok: false; sebab: "kunci" | "sdk" };

export type HasilFailDitulis = { ok: true; nama: string } | { ok: false };

/** `sumber` = ID media tetingkap Degup (desktopCapturer) untuk getUserMedia `chromeMediaSourceId`. */
export type HasilRakamMula = { ok: true; nama: string; sumber: string } | { ok: false };

export interface DegupApi {
  mula(): Promise<Permulaan>;
  simpanTetapan(ubah: Partial<Tetapan>): Promise<Tetapan>;
  simpanKunci(kunci: string): Promise<HasilKunci>;
  padamKunci(): Promise<void>;
  padamSemua(): Promise<string[]>;
  failDitulis(): Promise<string[]>;
  bukaPautan(id: string): Promise<void>;
  /** Kandungan fixture yang sah (nama dari `Permulaan.fixtures` sahaja); null bila tiada/rosak. */
  bacaFixture(fail: string): Promise<unknown>;
  /** Simpan kad keputusan PNG ke folder Gambar/Degup; main menamakan fail. */
  simpanKad(png: Uint8Array): Promise<HasilSimpanKad>;
  /** Buka folder kad dalam pengurus fail sistem. */
  bukaFolderKad(): Promise<void>;
  /** Sumber live: main mengikat SDK (malas) dan memulangkan kunci untuk pembina SDK renderer. */
  sediaLive(): Promise<HasilSediaLive>;
  /** Perakam demo §4.9: main mencipta fail Video/Degup/degup-demo-<masa>.webm. */
  rakamMula(): Promise<HasilRakamMula>;
  /** Satu ketul `MediaRecorder` (webm). false = ditolak; renderer menamatkan rakaman. */
  rakamTulis(bait: Uint8Array): Promise<boolean>;
  rakamTamat(): Promise<HasilFailDitulis>;
  /** Perakam fixture §4.10 (bila `config.rakam_fixture`): main menulis HANYA bila lulus pengesah skema. */
  simpanFixture(data: unknown): Promise<HasilFailDitulis>;
}

export const SALURAN = {
  mula: "degup:mula",
  simpanTetapan: "degup:simpan-tetapan",
  simpanKunci: "degup:simpan-kunci",
  padamKunci: "degup:padam-kunci",
  padamSemua: "degup:padam-semua",
  failDitulis: "degup:fail-ditulis",
  bukaPautan: "degup:buka-pautan",
  bacaFixture: "degup:baca-fixture",
  simpanKad: "degup:simpan-kad",
  bukaFolderKad: "degup:buka-folder-kad",
  sediaLive: "degup:sedia-live",
  rakamMula: "degup:rakam-mula",
  rakamTulis: "degup:rakam-tulis",
  rakamTamat: "degup:rakam-tamat",
  simpanFixture: "degup:simpan-fixture",
} as const;
