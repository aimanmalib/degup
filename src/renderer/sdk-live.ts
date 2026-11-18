// The real SDK factory for the live source: `SmartSpectraSDK` from `@smartspectra/node-sdk/renderer` plus `decodeMetrics`.
// Kept apart from src/sumber/live.ts so that file can be tested against a fake SDK.
// Kilang SDK sebenar untuk sumber `live` (renderer): `@smartspectra/node-sdk/renderer` + `decodeMetrics`.
// Dipisah dari `src/sumber/live.ts` supaya sumber boleh diuji dengan SDK tiruan tanpa jambatan preload/pakej asli.
import { decodeMetrics } from "@smartspectra/node-sdk/messages";
import { breathingMetrics, cardioMetrics, SmartSpectraSDK } from "@smartspectra/node-sdk/renderer";
import type { MetrikSdk } from "../core/metrik.js";
import type { KilangSdk, SdkRenderer } from "../sumber/live.js";

export const kilangSdk: KilangSdk = {
  cipta: (opsyen) => new SmartSpectraSDK(opsyen) as unknown as SdkRenderer,
  nyahkod: (buf) => decodeMetrics(buf) as unknown as MetrikSdk,
  kumpulan: { cardio: cardioMetrics, breathing: breathingMetrics },
};
