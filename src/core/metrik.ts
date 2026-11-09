// Bentuk minimum payload `metrics` SDK selepas `decodeMetrics` (PRD §4.3, §4.10) yang dibaca teras.
// Teras tidak mengimport SDK: jenis ini salinan struktur (camelCase protobufjs), bukan import.

/** Cap masa SDK: µs sejak epoch; protobufjs boleh memulangkan Long. */
export type CapMasa = number | { toNumber(): number };

export interface Ukuran {
  value?: number | null;
  stable?: boolean | null;
  timestamp?: CapMasa | null;
}

export interface UkuranKeyakinan extends Ukuran {
  confidence?: number | null;
}

export interface MetrikSdk {
  cardio?: {
    pulseRate?: UkuranKeyakinan[] | null;
    arterialPressureTrace?: UkuranKeyakinan[] | null;
  } | null;
  /** Mesej `Pulse` (trace tanpa keyakinan): sandaran PRD §4.3 bila jejak arteri kosong. */
  pulse?: {
    rate?: UkuranKeyakinan[] | null;
    trace?: Ukuran[] | null;
  } | null;
  breathing?: {
    rate?: UkuranKeyakinan[] | null;
    upperTrace?: Ukuran[] | null;
  } | null;
}

export function keNombor(t: CapMasa | null | undefined): number | null {
  if (t === null || t === undefined) return null;
  return typeof t === "number" ? t : t.toNumber();
}

/** Satu sampel jejak dinormalkan: masa µs epoch, nilai, keyakinan (0–100). */
export interface Sampel {
  t: number;
  v: number;
  c: number;
}
