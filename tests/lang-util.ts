/** Ratakan objek lang bersarang kepada kunci bertitik → teks. Nilai bukan rentetan = ralat (fail lang hanya teks). */
export function ratakan(o: unknown, awalan = ""): Record<string, string> {
  const hasil: Record<string, string> = {};
  if (typeof o !== "object" || o === null || Array.isArray(o)) throw new Error(`lang: ${awalan || "(akar)"} bukan objek`);
  for (const [k, v] of Object.entries(o)) {
    const kunci = awalan ? `${awalan}.${k}` : k;
    if (typeof v === "string") hasil[kunci] = v;
    else Object.assign(hasil, ratakan(v, kunci));
  }
  return hasil;
}

/** Pemegang tempat {nama} dalam teks. */
export const pemegang = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
