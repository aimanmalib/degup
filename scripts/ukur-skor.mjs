#!/usr/bin/env node
// Measures what tappers who feel nothing score (K1): six seeded tapper models through the real kiraSkor, config/app.json thresholds.
// Prints a Markdown table for docs/MEASUREMENTS.md, section "What a tapper who feels nothing scores". No network, no SDK.
// Guna: node scripts/ukur-skor.mjs [pusingan=2000] [benih=2026]
import { readFileSync } from "node:fs";
import { AKAR, muatTs } from "./muat-ts.mjs";

const n = Number(process.argv[2] ?? 2000);
const benih = Number(process.argv[3] ?? 2026);
const app = JSON.parse(readFileSync(`${AKAR}config/app.json`, "utf8"));
const { MODEL, kiraJalur } = await muatTs("tests/pengetuk-model.ts");
const en = JSON.parse(readFileSync(`${AKAR}lang/en.json`, "utf8"));
const jalur = [app.rasa.liputan.jalur, ...app.rasa.jalur.map((j) => j.id).reverse()];
const pct = (x) => `${(x ?? 0).toFixed(1)}%`;
const keAtas = (p) => (p.ada_rasa ?? 0) + (p.selaras ?? 0);
// Peraturan sebelum K1 (untuk perbandingan sahaja): ada_rasa = p < 0.05 tanpa R minimum, tiada syarat liputan.
const sebelum = {
  ...app.rasa,
  liputan: { ...app.rasa.liputan, ketukan_min: 0, rentang_min_s: 0 },
  jalur: app.rasa.jalur.map((j) => (j.id === "ada_rasa" ? { id: j.id, p_bawah: j.p_bawah } : j)),
};

console.log(`| Tapper model | ${jalur.map((j) => `"${en.rasa.jalur[j]}"`).join(" | ")} | "${en.rasa.jalur.ada_rasa}" or above | Before K1: "${en.rasa.jalur.ada_rasa}" or above |`);
console.log(`|---|${jalur.map(() => "---:").join("|")}|---:|---:|`);
for (const [id, m] of Object.entries(MODEL)) {
  const p = kiraJalur(id, app.rasa, n, benih);
  const lama = kiraJalur(id, sebelum, n, benih);
  console.log(`| ${m.label} | ${jalur.map((j) => pct(p[j])).join(" | ")} | ${pct(keAtas(p))} | ${pct(keAtas(lama))} |`);
}
console.log(`\n${n} rounds per model, seed ${benih}, thresholds: ` +
  app.rasa.jalur.filter((j) => j.r_min || j.p_bawah).map((j) => `${j.id} R ≥ ${j.r_min}, p < ${j.p_bawah}`).join("; ") +
  `; coverage ≥ ${app.rasa.liputan.ketukan_min} taps across ≥ ${app.rasa.liputan.rentang_min_s} s.`);
