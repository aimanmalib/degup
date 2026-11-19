// Kotak petunjuk (PRD §4.1, PH§5.5 K2): teks SDK diterjemah ikut kod papar (dihadkan kadar), dikongsi LIHAT, RASA, LENTUR.
// Kod nasihat dipapar tanpa "Dijeda."; kod kritikal yang menjadi jeda diawali "Dijeda.".
import { KOD_OK, kunciPetunjuk, type PenjejakJeda } from "../../core/petunjuk.js";
import { h } from "../dom.js";
import type { Keadaan } from "../keadaan.js";

export function kotakPetunjuk(): HTMLElement {
  return h("div", { class: "petunjuk", role: "status", "aria-live": "assertive", "data-uji": "petunjuk", hidden: true });
}

export function kemasPetunjuk(el: HTMLElement, k: Keadaan, jeda: PenjejakJeda): void {
  const kod = jeda.kodPapar;
  const tampak = jeda.dijeda || kod !== KOD_OK;
  el.hidden = !tampak;
  const sebab = k.t(kunciPetunjuk(kod));
  const teks = !tampak ? "" : jeda.dijeda ? `${k.t("petunjuk.dijeda")} ${sebab}` : sebab;
  if (el.textContent !== teks) el.textContent = teks;
  el.dataset.kod = String(kod);
  el.dataset.jeda = String(jeda.dijeda);
}
