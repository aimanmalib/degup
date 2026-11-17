#!/usr/bin/env node
// Media README (D15): logo PNG dari docs/media/logo.svg dan GIF aliran dari bingkai e2e/media-readme.spec.ts.
//   node scripts/media-readme.mjs logo            → docs/media/logo-512.png + logo-64.png (Chromium Playwright, latar lutsinar)
//   node scripts/media-readme.mjs gif <folder>    → docs/media/flow.gif dari <folder>/*.png (ffmpeg palet; FFMPEG=<laluan> pilihan)
// Bukan sebahagian gerbang: dijalankan tangan bila rupa app berubah. Nilai saiz dan rentak dalam config/app.json tidak disentuh;
// saiz media di sini ialah saiz fail README sahaja.
import { chromium } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const MEDIA = fileURLToPath(new URL("../docs/media/", import.meta.url));
const SAIZ_LOGO = [512, 64];
const GIF = { lebar: 800, fps: 5, maks_bait: 3 * 1024 * 1024 };

async function logo() {
  const svg = readFileSync(join(MEDIA, "logo.svg"), "utf8");
  const pelayar = await chromium.launch();
  try {
    for (const s of SAIZ_LOGO) {
      const page = await pelayar.newPage({ viewport: { width: s, height: s } });
      await page.setContent(
        `<html><body style="margin:0;background:transparent">${svg.replace("<svg ", `<svg style="display:block;width:${s}px;height:${s}px" `)}</body></html>`,
      );
      const keluar = join(MEDIA, `logo-${s}.png`);
      await page.screenshot({ path: keluar, omitBackground: true });
      console.log(`${keluar} ${statSync(keluar).size} bait`);
      await page.close();
    }
  } finally {
    await pelayar.close();
  }
}

function gif(folder) {
  if (!folder) throw new Error("guna: media-readme.mjs gif <folder bingkai>");
  const n = readdirSync(folder).filter((f) => /^\d+\.png$/.test(f)).length;
  if (n < 2) throw new Error(`bingkai terlalu sedikit dalam ${folder}: ${n}`);
  const ff = process.env.FFMPEG ?? "ffmpeg";
  const keluar = join(MEDIA, "flow.gif");
  const tapis = `fps=${GIF.fps},scale=${GIF.lebar}:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=96:stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=4`;
  execFileSync(ff, ["-v", "error", "-y", "-framerate", String(GIF.fps), "-i", join(folder, "%04d.png"), "-vf", tapis, "-loop", "0", keluar], {
    stdio: "inherit",
  });
  const bait = statSync(keluar).size;
  console.log(`${keluar} ${n} bingkai ${bait} bait`);
  if (bait > GIF.maks_bait) throw new Error(`GIF melebihi ${GIF.maks_bait} bait`);
}

const [arahan, ...hujah] = process.argv.slice(2);
if (arahan === "logo") await logo();
else if (arahan === "gif") gif(hujah[0]);
else {
  console.error("guna: node scripts/media-readme.mjs logo | gif <folder>");
  process.exit(2);
}
