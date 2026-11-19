// Bina halaman Simulation pelayar (J8) → config.sim_web.folder (docs/sim/): renderer app yang SAMA atas jambatan pelayar
// `src/web/`, modul SDK diganti `src/web/sdk-tiada.ts` (pakej SDK tidak dibundel). Fail statik, tiada pelayan.
//   node scripts/bina-sim-web.mjs           → tulis folder
//   node scripts/bina-sim-web.mjs --semak   → keluar 1 jika folder dalam repo tidak sama dengan binaan dari sumber
import { build, transform } from "esbuild";
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const AKAR = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const FON = {
  "fon/bricolage.woff2": "@fontsource-variable/bricolage-grotesque/files/bricolage-grotesque-latin-wght-normal.woff2",
  "fon/atkinson-400.woff2": "@fontsource/atkinson-hyperlegible-next/files/atkinson-hyperlegible-next-latin-400-normal.woff2",
  "fon/atkinson-700.woff2": "@fontsource/atkinson-hyperlegible-next/files/atkinson-hyperlegible-next-latin-700-normal.woff2",
  // Lesen SIL OFL 1.1 diedar bersama fon dalam folder awam.
  "fon/LICENSE-bricolage-grotesque.txt": "@fontsource-variable/bricolage-grotesque/LICENSE",
  "fon/LICENSE-atkinson-hyperlegible-next.txt": "@fontsource/atkinson-hyperlegible-next/LICENSE",
};

/** Ganti `./sdk-live.js` (diimport sesi.ts) dengan pengganti tanpa SDK; pakej SDK yang terlepas = binaan gagal. */
const tanpaSdk = {
  name: "tanpa-sdk",
  setup(b) {
    b.onResolve({ filter: /(^|\/)sdk-live\.js$/ }, () => ({ path: join(AKAR, "src/web/sdk-tiada.ts") }));
    b.onResolve({ filter: /^@smartspectra\// }, (a) => ({ errors: [{ text: `SDK tidak dibenarkan dalam halaman sim: ${a.path}` }] }));
  },
};

/** Semua fail halaman: { laluan relatif: Buffer }. */
export async function binaSimWeb() {
  const konfig = JSON.parse(readFileSync(join(AKAR, "config/app.json"), "utf8"));
  const versi = JSON.parse(readFileSync(join(AKAR, "package.json"), "utf8")).version;
  const r = await build({
    entryPoints: [join(AKAR, "src/web/main.ts")],
    bundle: true,
    write: false,
    minify: true,
    platform: "browser",
    format: "iife",
    target: "es2022",
    legalComments: "none",
    charset: "utf8",
    logLevel: "warning",
    define: { __VERSI__: JSON.stringify(versi) },
    plugins: [tanpaSdk],
    outfile: "app.min.js",
  });
  // Output diminify bernama `*.min.*` (output binaan, bukan sumber; pagar tidak mengukurnya).
  const css = await transform(readFileSync(join(AKAR, "src/renderer/gaya.css"), "utf8"), { loader: "css", minify: true, legalComments: "none" });
  const html = readFileSync(join(AKAR, "src/renderer/index.html"), "utf8")
    .replace(/<title>[^<]*<\/title>/, `<title>${konfig.sim_web.tajuk}</title>`)
    .replace('href="gaya.css"', 'href="gaya.min.css"')
    .replace('src="app.js"', 'src="app.min.js"');
  const fail = {
    "index.html": Buffer.from(html),
    "app.min.js": Buffer.from(r.outputFiles[0].contents),
    "gaya.min.css": Buffer.from(css.code),
  };
  for (const [ke, dari] of Object.entries(FON)) fail[ke] = readFileSync(join(AKAR, "node_modules", dari));
  return { folder: join(AKAR, konfig.sim_web.folder), fail };
}

/** Fail yang berbeza atau hilang dalam folder berbanding binaan. */
export function beza(folder, fail) {
  return Object.entries(fail)
    .filter(([n, b]) => !existsSync(join(folder, n)) || !readFileSync(join(folder, n)).equals(b))
    .map(([n]) => n);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { folder, fail } = await binaSimWeb();
  if (process.argv.includes("--semak")) {
    const b = beza(folder, fail);
    if (b.length) {
      console.error(`docs/sim lapuk: ${b.join(", ")} (jalankan node scripts/bina-sim-web.mjs)`);
      process.exit(1);
    }
    console.log("docs/sim sama dengan sumber");
  } else {
    for (const [n, b] of Object.entries(fail)) {
      mkdirSync(dirname(join(folder, n)), { recursive: true });
      writeFileSync(join(folder, n), b);
    }
    console.log(`sim web → ${folder} (${Object.keys(fail).length} fail, app.min.js ${fail["app.min.js"].length} bait)`);
  }
}
