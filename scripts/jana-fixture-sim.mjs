#!/usr/bin/env node
// Jana `fixtures/sim-contoh.json` (PRD §4.10, berlabel simulasi) dari penjana `sim`. Deterministik.
// Guna: node scripts/jana-fixture-sim.mjs   (Node 22/24 dari nvm)
import { build } from "esbuild";
import { readFileSync, writeFileSync } from "node:fs";

const app = JSON.parse(readFileSync("config/app.json", "utf8"));
const hasil = await build({
  entryPoints: ["src/sumber/sim-fixture.ts"],
  bundle: true,
  write: false,
  format: "esm",
  platform: "node",
});
const mod = await import("data:text/javascript;base64," + Buffer.from(hasil.outputFiles[0].text).toString("base64"));

const { benih, ...sim } = app.sim;
delete sim._nota;
const jana = {
  t0: Date.UTC(2026, 10, 9, 12, 0, 0) * 1000,
  benih,
  lihat_s: app.aliran.lihat_s,
  rasa_s: app.aliran.rasa_s,
  lentur_s: app.aliran.lentur_s,
  ketuk_sesaran_ms: 250,
  ketuk_jitter_ms: 60,
  ketuk_kadar: 0.85,
};
const f = mod.janaFixtureSim({ ...sim, benih }, jana, app.replay.skema, "sim-contoh");
writeFileSync(app.replay.contoh, JSON.stringify(f) + "\n");
console.log(`${app.replay.contoh}: jejak ${f.jejak.length}, nadi ${f.nadi.length}, nafas ${f.nafas.length}, ketukan ${f.ketukan.length}`);
