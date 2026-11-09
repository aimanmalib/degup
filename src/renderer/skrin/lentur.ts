// LENTUR (PRD §4.2, §4.5): pelita jadi panduan nafas (tarik `tarik_s` membesar, hembus `hembus_s` mengecil), jalur masa nyata
// sela degupan (IBI) dilorek ikut fasa nafas, angka hidup "Sela degupan: a → b ms". Di hujung: ringkasan ms + PRQ + ayat RSA tetap.
// Jeda petunjuk membekukan masa babak (panduan nafas terus berjalan, D12). Tiada pentafsiran baik/buruk.
import { binaKeputusan, segmenFasa, tarikhTempatan, type SegmenFasa } from "../../core/lentur.js";
import { fasaPanduan, kiraIbi, kiraLentur, type HasilLentur, type Ibi, type KonfigLentur } from "../../core/rsa.js";
import type { Babak, Ruang } from "../app.js";
import { h } from "../dom.js";
import { kiniUs } from "../sesi.js";
import { pratonton } from "./lihat.js";
import { pelita } from "./pelita.js";
import { kotakPetunjuk, kemasPetunjuk } from "./petunjuk.js";

const SVG = "http://www.w3.org/2000/svg";

function s<K extends keyof SVGElementTagNameMap>(tag: K, atr: Record<string, string | number>): SVGElementTagNameMap[K] {
  const el = document.createElementNS(SVG, tag);
  for (const [k, v] of Object.entries(atr)) el.setAttribute(k, String(v));
  return el;
}

interface KonfigJalur {
  lebar: number;
  tinggi: number;
  julat_min_ms: number;
  pad_ms: number;
  titik_r: number;
}

/** Lukis jalur IBI: lorek fasa (penuh tinggi), garis bersambung + titik. Domain x = [mula, hingga]; y = julat IBI + pad. */
function lukisJalur(svg: SVGSVGElement, ibi: readonly Ibi[], segmen: readonly SegmenFasa[], mula: number, hingga: number, kfg: KonfigJalur): void {
  const { lebar, tinggi } = kfg;
  const x = (t: number) => (Math.min(hingga, Math.max(mula, t)) - mula) / Math.max(1, hingga - mula) * lebar;
  const ms = ibi.map((i) => i.ms);
  let lo = Math.min(...ms) - kfg.pad_ms;
  let hi = Math.max(...ms) + kfg.pad_ms;
  if (!ibi.length) [lo, hi] = [0, 1];
  if (hi - lo < kfg.julat_min_ms) {
    const tengah = (hi + lo) / 2;
    [lo, hi] = [tengah - kfg.julat_min_ms / 2, tengah + kfg.julat_min_ms / 2];
  }
  const pad = kfg.titik_r * 2;
  const y = (v: number) => tinggi - pad - ((v - lo) / (hi - lo)) * (tinggi - 2 * pad);
  // Lorek penuh tinggi (lembut) + bar fasa di dasar (jelas): tarik = warna pelita, hembus = garis.
  const anak: SVGElement[] = segmen.flatMap((g) => {
    const atr = { x: x(g.mula), width: Math.max(0, x(g.akhir) - x(g.mula)) };
    return [
      s("rect", { class: `lorek-${g.fasa}`, ...atr, y: 0, height: tinggi }),
      s("rect", { class: `bar-${g.fasa}`, ...atr, y: tinggi - kfg.titik_r, height: kfg.titik_r }),
    ];
  });
  if (ibi.length > 1) anak.push(s("polyline", { class: "ibi-garis", points: ibi.map((i) => `${x(i.t).toFixed(1)},${y(i.ms).toFixed(1)}`).join(" ") }));
  for (const i of ibi) anak.push(s("circle", { class: "ibi-titik", cx: x(i.t), cy: y(i.ms), r: kfg.titik_r }));
  svg.replaceChildren(...anak);
}

/** Panduan nafas pada pelita: satu kitaran = tarik membesar, hembus mengecil; kurang gerak = kelegapan sahaja. */
function pacuNafas(teras: HTMLElement, kfg: KonfigLentur & { pelita_skala_tarik: number; pelita_skala_hembus: number }): Animation {
  const kitaranMs = (kfg.tarik_s + kfg.hembus_s) * 1000;
  const puncak = kfg.tarik_s / (kfg.tarik_s + kfg.hembus_s);
  const kurangGerak = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const [kecil, besar] = kurangGerak
    ? [{ opacity: 0.45 }, { opacity: 1 }]
    : [{ transform: `scale(${kfg.pelita_skala_hembus})` }, { transform: `scale(${kfg.pelita_skala_tarik})` }];
  return teras.animate(
    [
      { ...kecil, easing: "ease-in-out" },
      { ...besar, offset: puncak, easing: "ease-in-out" },
      { ...kecil },
    ],
    { duration: kitaranMs, iterations: Infinity },
  );
}

export function babakLentur(r: Ruang): Babak {
  const { k } = r;
  const sesi = r.sesi!;
  const kfg = k.konfig;
  const kl = kfg.lentur as KonfigLentur & typeof kfg.lentur;
  const tempohUs = k.masaS(kfg.aliran.lentur_s) * 1e6;
  const mula = kiniUs();
  let tAkhir = mula;
  let berlaluUs = 0;
  let jedaUs = 0;
  let akhir: number | null = null;
  let hasil: HasilLentur | null = null;
  let anim: Animation | null = null;
  let dom: {
    akar: HTMLElement;
    jalur: SVGSVGElement;
    sela: HTMLElement;
    sumber: HTMLElement;
    fasa: HTMLElement;
    jarum: HTMLElement;
    petunjuk: HTMLElement;
  } | null = null;

  const ibiKini = (hingga: number) =>
    kiraIbi(
      sesi.pengesan.degupan().filter((d) => d.t >= mula && d.t < hingga),
      (t) => sesi.pengesan.kualitiPada(t),
      kfg.rasa.kualiti_saat_min,
    );

  function lukisHidup(): void {
    if (!dom) return;
    const { t } = k;
    const kini = akhir ?? kiniUs();
    const ibi = ibiKini(kini);
    const fasa = segmenFasa(sesi.lentur.nafas(), mula, kini, true, kl);
    lukisJalur(dom.jalur, ibi, fasa.segmen, mula, Math.max(kini, mula + tempohUs + jedaUs), kl.jalur);
    const [a, b] = ibi.slice(-2);
    dom.sela.textContent = a && b ? t("lentur.sela", { dari: Math.round(a.ms), ke: Math.round(b.ms) }) : t("lentur.menunggu");
    dom.sela.dataset.n = String(ibi.length);
    dom.sumber.textContent = t(fasa.sumber === "jejak" ? "lentur.fasa_jejak" : "lentur.fasa_panduan");
  }

  function tamat(t: number): void {
    akhir = t;
    dom?.akar.setAttribute("data-keadaan", "mengira");
    // Sama seperti RASA: pengesan mengesahkan puncak terakhir dengan sedikit lewat.
    setTimeout(() => {
      if (r.sesi !== sesi || r.skrin !== "lentur") return;
      hasil = kiraLentur(
        {
          degupan: sesi.pengesan.degupan(),
          kualitiPada: (x) => sesi.pengesan.kualitiPada(x),
          kualitiSaatMin: kfg.rasa.kualiti_saat_min,
          mula,
          akhir: t,
          nafas: sesi.lentur.nafas(),
          prq: sesi.lentur.prq(mula, t),
        },
        kl,
      );
      anim?.cancel();
      const lama = dom?.akar;
      lama?.replaceWith(babak.el()); // babak sama (keadaan kekal), DOM dalam keadaan hujung
    }, kl.tunggu_akhir_ms);
  }

  function kemas(): void {
    if (akhir !== null || !dom) return;
    const kini = kiniUs();
    const dt = kini - tAkhir;
    tAkhir = kini;
    if (sesi.jeda.dijeda) jedaUs += dt;
    else berlaluUs += dt;
    dom.akar.dataset.keadaan = sesi.jeda.dijeda ? "dijeda" : "bernafas";
    dom.fasa.textContent = k.t(`lentur.${fasaPanduan(kini, mula, kl)}`);
    dom.jarum.style.transform = `scaleX(${Math.max(0, 1 - berlaluUs / tempohUs)})`;
    kemasPetunjuk(dom.petunjuk, k, sesi.jeda);
    if (berlaluUs >= tempohUs) tamat(kini);
  }

  const offDegup = sesi.onDegupan(() => lukisHidup());
  const offJeda = sesi.onJeda(kemas);
  const pemasa = setInterval(kemas, kl.kemas_ms);

  function hujung(): HTMLElement {
    const { t } = k;
    const ms = hasil?.ringkasanMs ?? null;
    const keKeputusan = () =>
      r.keKeputusan(binaKeputusan(r.hasilSkor, hasil, sesi.lentur.nadiPurata(sesi.mulaUs, akhir ?? kiniUs()), tarikhTempatan(new Date())));
    return h(
      "div",
      { class: "lentur-hujung", "data-uji": "lentur-hujung", "data-ms": ms ?? "" },
      h("h2", { class: "lentur-tajuk" }, t("lentur.tajuk_hujung")),
      ms === null
        ? h("p", { class: "lentur-ringkasan", "data-uji": "lentur-ringkasan" }, t("lentur.tak_cukup"))
        : h(
            "p",
            { class: "lentur-ringkasan", "data-uji": "lentur-ringkasan" },
            h("span", { class: "lentur-ms" }, t("keputusan.ms", { ms })),
            h("span", {}, t("lentur.ringkasan", { ms })),
          ),
      hasil?.prq != null ? h("p", { class: "lentur-nisbah", "data-uji": "lentur-prq" }, t("lentur.nisbah", { prq: hasil.prq })) : null,
      h("p", { class: "lentur-penerangan" }, t("lentur.penerangan")),
      h("p", { class: "penafian" }, t("umum.penafian")),
      h("button", { class: "butang utama", type: "button", "data-uji": "ke-keputusan", onclick: keKeputusan }, t("lentur.ke_keputusan")),
    );
  }

  const babak: Babak = {
    el() {
      const { t } = k;
      const p = pelita("nafas");
      const teras = p.querySelector<HTMLElement>(".pelita-teras")!;
      const fasa = h("p", { class: "lentur-fasa", "aria-live": "polite", "data-uji": "fasa" });
      const jalur = s("svg", {
        class: "jalur-ibi",
        viewBox: `0 0 ${kl.jalur.lebar} ${kl.jalur.tinggi}`,
        role: "img",
        "aria-label": t("lentur.jalur_label", { s: kfg.aliran.lentur_s }),
        "data-uji": "jalur-ibi",
      });
      const sela = h("p", { class: "lentur-sela", "data-uji": "sela" });
      const sumber = h("span", { class: "nota" });
      const jarum = h("span", { class: "pembilang-jarum" });
      const petunjuk = kotakPetunjuk();
      const selesai = hasil !== null;
      const akar = h(
        "div",
        { class: "lentur", "data-uji": "lentur", "data-keadaan": selesai ? "hujung" : "bernafas" },
        h("h1", { class: "sr" }, t("babak.lentur")),
        pratonton(r),
        selesai
          ? hujung()
          : h(
              "div",
              { class: "lentur-pandu" },
              p,
              fasa,
              h("p", { class: "arahan" }, t("lentur.arahan")),
              petunjuk,
              h("p", { class: "nota lentur-mengira" }, t("lentur.mengira")),
            ),
        h(
          "figure",
          { class: "lentur-jalur" },
          sela,
          jalur,
          h(
            "figcaption",
            { class: "petunjuk-garis" },
            h("span", { class: "kunci-tarik" }, t("lentur.tarik")),
            h("span", { class: "kunci-hembus" }, t("lentur.hembus")),
            sumber,
          ),
        ),
        selesai
          ? null
          : h("div", { class: "pembilang", role: "timer", "aria-label": t("lentur.pembilang", { s: kfg.aliran.lentur_s }) }, jarum),
        h("p", { class: "nota" }, t("lihat.esc")),
      );
      dom = { akar, jalur, sela, sumber, fasa, jarum, petunjuk };
      if (!selesai) {
        anim?.cancel();
        anim = pacuNafas(teras, kl);
        anim.currentTime = (kiniUs() - mula) / 1000; // bina semula (tukar bahasa) kekal sefasa dengan panduan
      }
      lukisHidup();
      kemas();
      return akar;
    },
    buang() {
      clearInterval(pemasa);
      offDegup();
      offJeda();
      anim?.cancel();
      dom = null;
    },
  };
  return babak;
}
