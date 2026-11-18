// Muat modul TypeScript repo untuk skrip Node (esbuild, ESM dalam memori). Pakej dalam `luaran` tidak dibundel.
import { build } from "esbuild";
import { fileURLToPath } from "node:url";

export const AKAR = fileURLToPath(new URL("..", import.meta.url));

export async function muatTs(entri, luaran = []) {
  const hasil = await build({
    entryPoints: [new URL(`../${entri}`, import.meta.url).pathname],
    bundle: true,
    write: false,
    format: "esm",
    platform: "node",
    external: luaran,
    logLevel: "silent",
  });
  return import("data:text/javascript;base64," + Buffer.from(hasil.outputFiles[0].text).toString("base64"));
}
