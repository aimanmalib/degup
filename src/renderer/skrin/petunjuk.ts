// Kotak petunjuk jeda (PRD §4.1): teks SDK diterjemah ikut kod, dikongsi LIHAT dan RASA.
import { kunciPetunjuk, type PenjejakJeda } from "../../core/petunjuk.js";
import { h } from "../dom.js";
import type { Keadaan } from "../keadaan.js";

export function kotakPetunjuk(): HTMLElement {
  return h("div", { class: "petunjuk", role: "status", "aria-live": "assertive", "data-uji": "petunjuk", hidden: true });
}

export function kemasPetunjuk(el: HTMLElement, k: Keadaan, jeda: PenjejakJeda): void {
  el.hidden = !jeda.dijeda;
  const teks = jeda.dijeda ? `${k.t("petunjuk.dijeda")} ${k.t(kunciPetunjuk(jeda.kodSemasa))}` : "";
  if (el.textContent !== teks) el.textContent = teks;
  el.dataset.kod = String(jeda.kodSemasa);
}
