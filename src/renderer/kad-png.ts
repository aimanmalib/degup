// Kad keputusan PNG (PRD §4.2): dilukis di kanvas dari data yang sama dengan skrin (`barisKad`), warna dari token CSS,
// fon app. Tempatan sahaja: bait dihantar ke main yang menulis ke Gambar/Degup. Tiada imej kamera, tiada muka.
import { barisKad, type Keputusan } from "../core/lentur.js";

type T = (kunci: string, nilai?: Record<string, string | number>) => string;

interface KonfigKad {
  lebar: number;
  tinggi: number;
}

const token = (nama: string) => getComputedStyle(document.documentElement).getPropertyValue(nama).trim();

/** Tulis teks; kecilkan fon sehingga muat `maks` piksel (BM/EN berbeza panjang). */
function teks(ctx: CanvasRenderingContext2D, s: string, x: number, y: number, fon: (px: number) => string, px: number, maks: number): void {
  let p = px;
  ctx.font = fon(p);
  while (p > 10 && ctx.measureText(s).width > maks) ctx.font = fon(--p);
  ctx.fillText(s, x, y);
}

export async function lukisKad(k: Keputusan, t: T, kfg: KonfigKad): Promise<Uint8Array> {
  const papar = (px: number, w = 700) => `${w} ${px}px Bricolage, Atkinson, sans-serif`;
  const badan = (px: number, w = 400) => `${w} ${px}px Atkinson, sans-serif`;
  await Promise.all([document.fonts.load(papar(64, 800)), document.fonts.load(badan(24)), document.fonts.load(badan(24, 700))]);
  const { lebar: W, tinggi: H } = kfg;
  const kanvas = document.createElement("canvas");
  kanvas.width = W;
  kanvas.height = H;
  const ctx = kanvas.getContext("2d")!;
  const warna = {
    malam: token("--malam"),
    malam2: token("--malam-2"),
    garis: token("--garis"),
    tulang: token("--tulang"),
    kabus: token("--kabus"),
    pelita: token("--pelita"),
    dalam: token("--pelita-dalam"),
    tepi: token("--pelita-tepi"),
    bara: token("--pelita-bara"),
    redup: token("--pelita-redup"),
  };

  ctx.fillStyle = warna.malam;
  ctx.fillRect(0, 0, W, H);
  // Pelita di kiri: halo + teras bergradien (sama dengan .pelita-teras).
  const cx = W * 0.24;
  const cy = H * 0.5;
  const r = H * 0.27;
  const halo = ctx.createRadialGradient(cx, cy, r * 0.6, cx, cy, r * 2.2);
  halo.addColorStop(0, warna.redup);
  halo.addColorStop(1, "transparent");
  ctx.fillStyle = halo;
  ctx.fillRect(0, 0, W * 0.55, H);
  const teras = ctx.createRadialGradient(cx - r * 0.16, cy - r * 0.24, 0, cx, cy, r);
  teras.addColorStop(0, warna.dalam);
  teras.addColorStop(0.38, warna.pelita);
  teras.addColorStop(0.72, warna.tepi);
  teras.addColorStop(1, warna.bara);
  ctx.fillStyle = teras;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  // Skor di atas pelita.
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = warna.malam;
  teks(ctx, k.skor === null ? "—" : String(k.skor), cx, cy - r * 0.06, (px) => papar(px, 800), Math.round(r * 0.85), r * 1.5);
  ctx.font = papar(Math.round(r * 0.16), 650);
  ctx.fillText(k.skor === null ? t("dedah.tiada_skor") : t("dedah.daripada"), cx, cy + r * 0.42);

  // Lajur kanan.
  const x0 = W * 0.5;
  const maks = W - x0 - W * 0.06;
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = warna.pelita;
  teks(ctx, t("app.nama"), x0, H * 0.16, (px) => papar(px, 800), 44, maks);
  ctx.fillStyle = warna.kabus;
  ctx.textAlign = "right";
  teks(ctx, k.tarikh, W - W * 0.06, H * 0.16, (px) => badan(px), 22, maks / 2);
  ctx.textAlign = "left";
  ctx.fillStyle = warna.kabus;
  teks(ctx, t("keputusan.skor"), x0, H * 0.27, (px) => badan(px, 700), 22, maks);
  ctx.fillStyle = k.jalur && k.skor !== null ? warna.tulang : warna.kabus;
  teks(ctx, k.jalur ? t(`rasa.jalur.${k.jalur}`) : t("dedah.tiada_skor"), x0, H * 0.36, (px) => papar(px, 700), 40, maks);

  let y = H * 0.45;
  const langkah = H * 0.105;
  for (const b of barisKad(k)) {
    ctx.strokeStyle = warna.garis;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x0, y);
    ctx.lineTo(x0 + maks, y);
    ctx.stroke();
    ctx.fillStyle = warna.kabus;
    teks(ctx, t(b.label), x0, y + langkah * 0.62, (px) => badan(px), 22, maks * 0.55);
    ctx.fillStyle = warna.tulang;
    ctx.textAlign = "right";
    teks(ctx, b.nilai ? t(b.nilai.kunci, b.nilai.nilai) : t("keputusan.tiada"), x0 + maks, y + langkah * 0.62, (px) => papar(px, 700), 28, maks * 0.45);
    ctx.textAlign = "left";
    y += langkah;
  }
  ctx.fillStyle = warna.kabus;
  teks(ctx, t("umum.penafian"), x0, H * 0.9, (px) => badan(px), 20, maks);
  teks(ctx, t("keputusan.kad_kredit"), x0, H * 0.95, (px) => badan(px), 16, maks);

  const blob = await new Promise<Blob | null>((ok) => kanvas.toBlob(ok, "image/png"));
  if (!blob) throw new Error("kanvas");
  return new Uint8Array(await blob.arrayBuffer());
}
