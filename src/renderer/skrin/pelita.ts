// "Pelita": bulatan cahaya Degup (PRD §4.2 "bulatan cahaya besar"). Lapisan gradien + skala/kelegapan sahaja (tiada filter beranimasi).
import { h } from "../dom.js";

export type ModPelita = "rehat" | "membaca";

export function pelita(mod: ModPelita): HTMLElement {
  return h(
    "div",
    { class: `pelita pelita-${mod}`, "aria-hidden": "true", "data-uji": "pelita" },
    h("span", { class: "pelita-halo" }),
    h("span", { class: "pelita-teras" }),
    mod === "membaca" ? h("span", { class: "pelita-lingkar" }) : null,
  );
}
