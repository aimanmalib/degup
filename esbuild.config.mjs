// Binaan Degup: main + preload (CJS, Node/Electron) dan renderer (IIFE pelayar) → dist/. Fon OFL disalin dari node_modules.
import { build } from "esbuild";
import { copyFileSync, mkdirSync, rmSync } from "node:fs";

const KELUAR = "dist";
const FON = [
  ["@fontsource-variable/bricolage-grotesque/files/bricolage-grotesque-latin-wght-normal.woff2", "bricolage.woff2"],
  ["@fontsource/atkinson-hyperlegible-next/files/atkinson-hyperlegible-next-latin-400-normal.woff2", "atkinson-400.woff2"],
  ["@fontsource/atkinson-hyperlegible-next/files/atkinson-hyperlegible-next-latin-700-normal.woff2", "atkinson-700.woff2"],
];

rmSync(KELUAR, { recursive: true, force: true });
mkdirSync(`${KELUAR}/renderer/fon`, { recursive: true });

const sama = { bundle: true, sourcemap: false, logLevel: "warning", target: "es2022" };
await Promise.all([
  build({ ...sama, entryPoints: ["src/main/main.ts"], outfile: `${KELUAR}/main.cjs`, platform: "node", format: "cjs", external: ["electron"] }),
  build({ ...sama, entryPoints: ["src/preload/preload.ts"], outfile: `${KELUAR}/preload.cjs`, platform: "node", format: "cjs", external: ["electron"] }),
  build({ ...sama, entryPoints: ["src/renderer/app.ts"], outfile: `${KELUAR}/renderer/app.js`, platform: "browser", format: "iife" }),
]);
copyFileSync("src/renderer/index.html", `${KELUAR}/renderer/index.html`);
copyFileSync("src/renderer/gaya.css", `${KELUAR}/renderer/gaya.css`);
for (const [dari, ke] of FON) copyFileSync(`node_modules/${dari}`, `${KELUAR}/renderer/fon/${ke}`);
console.log("build ok → dist/");
