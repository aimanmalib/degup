// Pengganti `src/renderer/sdk-live.ts` dalam bundel halaman Simulation (J8): pakej SDK tidak dibundel langsung.
// Sumber dipaksa `sim`, jadi kilang ini tidak pernah dipanggil; jika dipanggil juga, ia gagal dengan jelas.
import type { KilangSdk } from "../sumber/live.js";

const tiada = (): never => {
  throw new Error("SmartSpectra SDK is not part of the browser Simulation page");
};

export const kilangSdk: KilangSdk = { cipta: tiada, nyahkod: tiada, kumpulan: {} };
