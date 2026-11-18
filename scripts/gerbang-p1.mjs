#!/usr/bin/env node
// Gerbang P1 (PRD §2 H1, H2): baca JSON `headless-smoke.mjs`, nilai ikut ambang `config/app.json` `p1`.
// Guna: node scripts/gerbang-p1.mjs <ringkasan.json>
// Keluar: 0 = "mod penuh" (H1 dan H2 lulus) · 1 = "R2" (PRD §7 mod kira) · 2 = input tidak sah.
import { readFileSync } from "node:fs";
import { muatTs } from "./muat-ts.mjs";

const laluan = process.argv[2];
if (!laluan) {
  console.error("guna: node scripts/gerbang-p1.mjs <ringkasan.json>");
  process.exit(2);
}
let r;
try {
  r = JSON.parse(readFileSync(laluan, "utf8"));
} catch {
  console.error(`tidak boleh baca JSON: ${laluan}`);
  process.exit(2);
}
if (r?.skema !== 1 || typeof r.nadi !== "object" || typeof r.degupan !== "object") {
  console.error("bukan ringkasan headless-smoke skema 1");
  process.exit(2);
}
const app = JSON.parse(readFileSync(new URL("../config/app.json", import.meta.url), "utf8"));
const { nilaiP1 } = await muatTs("src/core/ukur-p1.ts");
const k = nilaiP1(r, app.p1);
const pc = (x) => (x === null ? "tiada" : `${x}`);
console.log(`H1 ${k.h1 ? "lulus" : "gagal"}: stable ${pc(r.nadi.peratus_stabil)}% (min ${app.p1.stabil_min * 100}%), nadi ${r.nadi.sampel}, nafas ${r.nafas.sampel}`);
console.log(
  `H2 ${k.h2 ? "lulus" : "gagal"}: degupan ${r.degupan.dikesan} lawan ${pc(r.degupan.dijangka)} (ralat ${pc(r.degupan.ralat_relatif)}), ` +
    `CV ${pc(r.degupan.cv_sela)}, jurang maks ${pc(r.degupan.jurang_maks_s)} s`,
);
if (k.sebab.length) console.log(`sebab: ${k.sebab.join(", ")}`);
console.log(k.mod === "penuh" ? "mod penuh" : "R2");
process.exit(k.mod === "penuh" ? 0 : 1);
