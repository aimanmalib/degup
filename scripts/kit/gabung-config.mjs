// Tindihan config kit (PELAN J6a, D22): `node scripts/kit/gabung-config.mjs <app.json> <kit.json>` menulis semula app.json
// dengan nilai kit (gabung dalam objek; tatasusunan dan nilai lain diganti; kunci `_nota` tindihan tidak disalin).
// Dipanggil oleh bina-kit.sh atas salinan git archive SAHAJA, tidak pernah atas config repo.
import { readFileSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

const objek = (x) => x !== null && typeof x === "object" && !Array.isArray(x);

/** Gabung `tindih` ke dalam salinan `asas`. Kunci tindihan yang tiada dalam asas = ralat (salah eja tidak senyap). */
export function gabung(asas, tindih, laluan = "") {
  const hasil = { ...asas };
  for (const [k, v] of Object.entries(tindih)) {
    if (k.startsWith("_")) continue;
    const di = laluan ? `${laluan}.${k}` : k;
    if (!(k in asas)) throw new Error(`kunci kit tiada dalam config asas: ${di}`);
    hasil[k] = objek(v) && objek(asas[k]) ? gabung(asas[k], v, di) : v;
  }
  return hasil;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const [failAsas, failTindih] = process.argv.slice(2);
  if (!failAsas || !failTindih) {
    console.error("guna: node gabung-config.mjs <app.json> <kit.json>");
    process.exit(2);
  }
  const hasil = gabung(JSON.parse(readFileSync(failAsas, "utf8")), JSON.parse(readFileSync(failTindih, "utf8")));
  writeFileSync(failAsas, JSON.stringify(hasil, null, 2) + "\n");
}
