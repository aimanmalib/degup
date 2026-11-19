// LIHAT (PRD §4.2): pratonton dicermin, pelita berdenyut pada setiap degupan dikesan, BPM + cincin keyakinan,
// "Sedia" selepas jejak stabil ≥ N s (atau tamat masa maksimum dengan nota). Jeda petunjuk SDK diterjemah.
import type { Babak, Ruang } from "../app.js";
import { h } from "../dom.js";
import { kiniUs } from "../sesi.js";
import { pelita } from "./pelita.js";
import { kotakPetunjuk, kemasPetunjuk } from "./petunjuk.js";
import { notaHenti } from "./sentuh.js";

const SVG = "http://www.w3.org/2000/svg";

function cincin(): { el: SVGSVGElement; isi: SVGCircleElement } {
  const el = document.createElementNS(SVG, "svg");
  el.setAttribute("class", "cincin");
  el.setAttribute("viewBox", "0 0 100 100");
  el.setAttribute("aria-hidden", "true");
  const bulat = (kelas: string) => {
    const c = document.createElementNS(SVG, "circle");
    c.setAttribute("class", kelas);
    for (const [k, v] of [["cx", "50"], ["cy", "50"], ["r", "48"], ["pathLength", "100"]]) c.setAttribute(k!, v!);
    return c;
  };
  const isi = bulat("cincin-isi");
  el.append(bulat("cincin-landasan"), isi);
  return { el, isi };
}

/** Pratonton kamera dicermin (LIHAT, LENTUR; PRD §4.9: rakaman menunjukkan manusia + isyarat). Sim/replay = kotak label. */
export function pratonton(r: Ruang): HTMLElement {
  const { t } = r.k;
  if (r.kamera.media) {
    const v = h("video", { class: "pratonton", autoplay: true, muted: true, playsinline: true, "aria-label": t("kamera.pratonton") });
    v.srcObject = r.kamera.media;
    return v;
  }
  return h("div", { class: "pratonton pratonton-kosong", "data-uji": "pratonton-sim" }, t("kamera.simulasi"));
}

export function babakLihat(r: Ruang): Babak {
  const { k } = r;
  const sesi = r.sesi!;
  const kfg = k.konfig;
  const mula = kiniUs();
  const sediaSelepas = k.masaS(kfg.aliran.lihat_sedia_selepas_stabil_s);
  const panggilSelepas = k.masaS(kfg.aliran.lihat_s);
  const maks = k.masaS(kfg.aliran.lihat_maks_s);
  const mencariSelepas = k.masaS(kfg.lihat.masih_mencari_s);
  const kurangGerak = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let dom: {
    akar: HTMLElement;
    teras: HTMLElement;
    bpm: HTMLElement;
    isi: SVGCircleElement;
    status: HTMLElement;
    sedia: HTMLButtonElement;
    nota: HTMLElement;
    mencari: HTMLElement;
    petunjuk: HTMLElement;
  } | null = null;

  const denyut = () => {
    if (!dom || sesi.jeda.dijeda || !sesi.nadi.keadaan.stabil) return;
    const s = kfg.lihat.denyut_skala;
    const bingkai = kurangGerak
      ? [{ opacity: 0.8 }, { opacity: 1, offset: 0.3 }, { opacity: 0.8 }]
      : [{ transform: "scale(1)" }, { transform: `scale(${s})`, offset: 0.3 }, { transform: "scale(1)" }];
    dom.teras.animate(bingkai, { duration: kfg.lihat.denyut_ms, easing: "ease-out" });
  };

  function kemas(): void {
    if (!dom) return;
    const { t } = k;
    const kini = kiniUs();
    const berlalu = (kini - mula) / 1e6;
    const nadi = sesi.nadi.keadaan;
    const dijeda = sesi.jeda.dijeda;
    const stabilS = sesi.nadi.stabilSelamaS(kini);
    const hidup = nadi.stabil && !dijeda;
    dom.akar.dataset.keadaan = dijeda ? "dijeda" : hidup ? "hidup" : "membaca";
    dom.bpm.textContent = hidup && nadi.bpm !== null ? String(Math.round(nadi.bpm)) : "—";
    dom.isi.style.strokeDashoffset = String(100 - (hidup ? Math.min(100, Math.max(0, nadi.keyakinan)) : 0));
    dom.status.textContent = hidup ? t("lihat.stabil") : t("lihat.membaca");
    // Baris kedua selepas N s tanpa bacaan (PH§5.5 K2): bacaan pertama boleh lambat pada kamera sebenar.
    const mencari = !hidup && !dijeda && berlalu >= mencariSelepas ? t("lihat.masih_mencari") : "";
    if (dom.mencari.textContent !== mencari) dom.mencari.textContent = mencari;
    dom.mencari.hidden = !mencari;
    const sedia = stabilS >= sediaSelepas && !dijeda;
    const tamat = berlalu >= maks;
    dom.sedia.disabled = !(sedia || tamat);
    dom.sedia.classList.toggle("panggil", !dom.sedia.disabled && berlalu >= panggilSelepas);
    dom.nota.textContent =
      sedia || dijeda
        ? ""
        : tamat
          ? t("lihat.belum_stabil")
          : hidup
            ? t("lihat.sedia_dalam", { s: Math.ceil(sediaSelepas - stabilS) })
            : "";
    kemasPetunjuk(dom.petunjuk, k, sesi.jeda);
  }

  const offDegup = sesi.onDegupan(denyut);
  const offJeda = sesi.onJeda(kemas);
  const pemasa = setInterval(kemas, kfg.lihat.kemas_ms);

  return {
    el() {
      const { t } = k;
      const p = pelita("hidup");
      const { el: svg, isi } = cincin();
      p.append(svg);
      const sedia = h("button", { class: "butang utama", type: "button", "data-uji": "sedia", disabled: true, onclick: () => r.pergi("rasa") }, t("lihat.sedia"));
      const bpm = h("span", { class: "bpm-angka", "data-uji": "bpm" }, "—");
      const status = h("p", { class: "status-baca", role: "status" });
      const mencari = h("p", { class: "status-baca status-kedua", "aria-live": "polite", "data-uji": "masih-mencari", hidden: true });
      const nota = h("p", { class: "nota", "aria-live": "polite", "data-uji": "nota-sedia" });
      const petunjuk = kotakPetunjuk();
      const akar = h(
        "div",
        { class: "lihat", "data-uji": "lihat" },
        pratonton(r),
        h("div", { class: "lihat-pusat" }, p, h("div", { class: "bpm" }, bpm, h("span", { class: "bpm-unit" }, t("lihat.unit")))),
        petunjuk,
        status,
        mencari,
        h("p", { class: "arahan" }, t("lihat.arahan")),
        h("div", { class: "lihat-tindakan" }, sedia, nota),
        notaHenti(r),
      );
      dom = { akar, teras: p.querySelector(".pelita-teras")!, bpm, isi, status, sedia, nota, mencari, petunjuk };
      kemas();
      return akar;
    },
    buang() {
      clearInterval(pemasa);
      offDegup();
      offJeda();
      dom = null;
    },
  };
}
