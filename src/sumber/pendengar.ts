// Satu-satunya tempat pendengar peristiwa SDK didaftar (app `live` dan pelari asap P1). Exhale: pendengar `metrics` kedua
// MENGGANTIKAN yang pertama, jadi setiap peristiwa didaftar SEKALI di sini dan pemanggil menyebar sendiri.
// Tiada kaedah permintaan Insight: `insight` automatik hanya dikira.

export interface PengendaliSdk {
  metrik(buf: Uint8Array): void;
  pengesahan(kod: number, tUs: number): void;
  status(s: number): void;
  insight(): void;
  /** `mesej` = teks mentah SDK; pemanggil MESTI meringkas + menapisnya (`ringkasRalat`) sebelum log atau skrin. */
  ralat(kod: number, bolehUlang: boolean, mesej: string): void;
}

export interface BolehDengar {
  on(peristiwa: string, f: (...a: never[]) => void): unknown;
}

type F = (...a: never[]) => void;

export function pasangPendengar(sdk: BolehDengar, h: PengendaliSdk): void {
  sdk.on("metrics", ((buf: Uint8Array) => h.metrik(buf)) as F);
  sdk.on("validationStatus", ((kod: number, tUs: number) => h.pengesahan(kod, tUs)) as F);
  sdk.on("processingStatus", ((s: number) => h.status(s)) as F);
  sdk.on("insight", (() => h.insight()) as F);
  // Mesej diteruskan mentah; pemanggil meringkasnya (baris pertama, dipotong, laluan rumah `~`, kunci ditapis; PH§5.6 L1).
  sdk.on("error", ((kod: number, mesej: unknown, bolehUlang: boolean) =>
    h.ralat(kod, Boolean(bolehUlang), typeof mesej === "string" ? mesej : "")) as F);
}
