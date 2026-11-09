// Pendedahan (PRD §4.2, §4.4): garis masa (tanda = degupan dilihat kamera, titik = ketukan, jalur kualiti berlorek),
// "Kamera nampak N degupan. Kau ketuk n.", skor 0–100 + jalur, ayat statistik, ayat tetap. "Cuba lagi" · "Teruskan".
import { ayatDedah, garisMasa, type GarisMasa } from "../../core/dedah.js";
import { kiraSkor, type HasilSkor } from "../../core/score.js";
import type { Babak, Ruang } from "../app.js";
import { h } from "../dom.js";

const SVG = "http://www.w3.org/2000/svg";

function s<K extends keyof SVGElementTagNameMap>(
  tag: K,
  atr: Record<string, string | number>,
): SVGElementTagNameMap[K] {
  const el = document.createElementNS(SVG, tag);
  for (const [k, v] of Object.entries(atr)) el.setAttribute(k, String(v));
  return el;
}

/** Garis masa SVG: unit viewBox dari config.dedah; animasi masuk = opacity/transform (CSS, `--i` = kedudukan). */
function lukisGaris(
  g: GarisMasa,
  lebar: number,
  tinggi: number,
  label: string,
): SVGSVGElement {
  const svg = s("svg", {
    class: "garis",
    viewBox: `0 0 ${lebar} ${tinggi}`,
    preserveAspectRatio: "none",
    role: "img",
    "aria-label": label,
  });
  const lorek = s("pattern", {
    id: "lorek",
    width: 6,
    height: 6,
    patternUnits: "userSpaceOnUse",
    patternTransform: "rotate(45)",
  });
  lorek.append(
    s("rect", { width: 6, height: 6, class: "lorek-latar" }),
    s("line", { x1: 0, y1: 0, x2: 0, y2: 6, class: "lorek-garis" }),
  );
  const defs = s("defs", {});
  defs.append(lorek);
  svg.append(defs);
  const yKualiti = tinggi - 12;
  for (const q of g.kualiti) {
    svg.append(
      s("rect", {
        class: q.rendah ? "kualiti rendah" : "kualiti",
        x: q.x * lebar,
        y: yKualiti,
        width: Math.max(0.5, q.w * lebar - 1),
        height: 8,
      }),
    );
  }
  svg.append(
    s("line", {
      class: "garis-paksi",
      x1: 0,
      y1: tinggi * 0.62,
      x2: lebar,
      y2: tinggi * 0.62,
    }),
  );
  for (const d of g.degupan) {
    const l = s("line", {
      class: d.dikira ? "tanda-degup" : "tanda-degup pudar",
      x1: d.x * lebar,
      x2: d.x * lebar,
      y1: 8,
      y2: tinggi * 0.62,
    });
    l.style.setProperty("--i", d.x.toFixed(3));
    svg.append(l);
  }
  for (const x of g.ketukan) {
    const c = s("circle", {
      class: "titik-ketuk",
      cx: x * lebar,
      cy: tinggi * 0.62,
      r: 5,
    });
    c.style.setProperty("--i", x.toFixed(3));
    svg.append(c);
  }
  return svg;
}

export function babakDedah(r: Ruang): Babak {
  const { k } = r;
  const sesi = r.sesi!;
  const kfg = k.konfig;
  const rasa = r.hasilRasa ?? { mula: 0, akhir: 0, ketukan: [] };
  const p = sesi.pengesan;
  const hasil: HasilSkor = kiraSkor(
    {
      degupan: p.degupan(),
      ketukan: rasa.ketukan,
      mula: rasa.mula,
      akhir: rasa.akhir,
      kualitiTetingkap: p.kualitiAntara(rasa.mula, rasa.akhir),
      kualitiPada: (t) => p.kualitiPada(t),
    },
    kfg.rasa,
  );
  r.hasilSkor = hasil;
  const garis = garisMasa({
    mula: rasa.mula,
    akhir: rasa.akhir,
    degupan: p.degupan(),
    ketukan: rasa.ketukan,
    kualitiSaat: p.kualitiSetiapSaat(),
    kualitiSaatMin: kfg.rasa.kualiti_saat_min,
  });
  let animasiSiap = false;
  let rangka = 0;

  /** Skor naik dari 0 (sekali sahaja; lukis semula selepas tukar bahasa terus ke nilai akhir). */
  const kiraNaik = (el: HTMLElement) => {
    if (animasiSiap || matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.textContent = String(hasil.skor);
      return;
    }
    const t0 = performance.now();
    const langkah = (t: number) => {
      const x = Math.min(1, (t - t0) / kfg.dedah.kiraan_ms);
      el.textContent = String(Math.round(hasil.skor * (1 - (1 - x) ** 3)));
      if (x < 1) rangka = requestAnimationFrame(langkah);
      else animasiSiap = true;
    };
    rangka = requestAnimationFrame(langkah);
  };

  return {
    el() {
      const { t } = k;
      const saat = Math.round((rasa.akhir - rasa.mula) / 1e6);
      const angka = h("span", { class: "skor-angka", "data-uji": "skor" }, "0");
      const kepala = hasil.cukup
        ? h(
            "div",
            { class: "skor" },
            h("p", { class: "skor-label" }, t("dedah.skor_label")),
            h(
              "p",
              { class: "skor-baris" },
              angka,
              h("span", { class: "skor-daripada" }, t("dedah.daripada")),
            ),
            h(
              "p",
              {
                class: `jalur jalur-${hasil.jalur}`,
                "data-uji": "jalur",
                "data-jalur": hasil.jalur ?? "",
              },
              t(`rasa.jalur.${hasil.jalur}`),
            ),
          )
        : h(
            "div",
            { class: "skor" },
            h("p", { class: "skor-label" }, t("dedah.skor_label")),
            h(
              "p",
              { class: "skor-tiada", "data-uji": "jalur", "data-jalur": "" },
              t("dedah.tiada_skor"),
            ),
          );
      const ayat = ayatDedah(hasil);
      const akar = h(
        "div",
        {
          class: "dedah",
          "data-uji": "dedah",
          "data-cukup": String(hasil.cukup),
        },
        h("h1", { class: "dedah-tajuk" }, t("dedah.tajuk")),
        kepala,
        h(
          "div",
          { class: "dedah-ayat" },
          ...ayat.map((a, i) =>
            h(
              "p",
              {
                class: i === 0 ? "ayat-kiraan" : "",
                "data-uji": a.kunci === "rasa.kiraan" ? "kiraan" : null,
                "data-n": a.kunci === "rasa.kiraan" ? hasil.n : null,
              },
              t(a.kunci, a.nilai),
            ),
          ),
        ),
        h(
          "figure",
          { class: "garis-bingkai" },
          lukisGaris(
            garis,
            kfg.dedah.lebar,
            kfg.dedah.tinggi,
            t("dedah.garis_label", { s: saat }),
          ),
          h(
            "figcaption",
            { class: "petunjuk-garis" },
            h("span", { class: "kunci-degup" }, t("dedah.kunci_degup")),
            h("span", { class: "kunci-ketuk" }, t("dedah.kunci_ketuk")),
            h("span", { class: "kunci-lorek" }, t("dedah.kunci_lorek")),
            h("span", { class: "kunci-saat" }, t("dedah.saat", { s: saat })),
          ),
        ),
        h(
          "div",
          { class: "dedah-kaki" },
          h("p", { class: "penafian" }, t("umum.penafian")),
          h(
            "div",
            { class: "butang-baris" },
            h(
              "button",
              {
                class: "butang",
                type: "button",
                "data-uji": "cuba-lagi",
                onclick: () => r.pergi("rasa"),
              },
              t("rasa.cuba_lagi"),
            ),
            h(
              "button",
              {
                class: "butang utama",
                type: "button",
                "data-uji": "teruskan",
                onclick: () => r.pergi("lentur"),
              },
              t("umum.teruskan"),
            ),
          ),
        ),
      );
      if (hasil.cukup) kiraNaik(angka);
      return akar;
    },
    buang() {
      cancelAnimationFrame(rangka);
    },
  };
}
