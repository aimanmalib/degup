// "Pelita": bulatan cahaya Degup (PRD §4.2 "bulatan cahaya besar"). Lapisan gradien + skala/kelegapan sahaja (tiada filter beranimasi).
import { h } from "../dom.js";

/**
 * rehat = bernafas perlahan · membaca = lingkar berputar · hidup = berdenyut ikut degupan (JS) · padam = RASA, pelita gelap ·
 * nafas = panduan nafas LENTUR (skala dipacu Web Animations dari config).
 */
export type ModPelita = "rehat" | "membaca" | "hidup" | "padam" | "nafas";

export function pelita(mod: ModPelita): HTMLElement {
  return h(
    "div",
    { class: `pelita pelita-${mod}`, "aria-hidden": "true", "data-uji": "pelita" },
    h("span", { class: "pelita-halo" }),
    h("span", { class: "pelita-teras" }),
    mod === "membaca" || mod === "hidup" ? h("span", { class: "pelita-lingkar" }) : null,
  );
}
