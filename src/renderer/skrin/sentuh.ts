// Skrin sentuh (PH§5.5 K5): peranti tanpa papan kekunci (telefon, tablet; media `config.sentuh.media`) tidak boleh menekan
// Space atau Esc. Di situ RASA meminta ketukan pada pelita dan nota Esc menjadi butang Henti yang memanggil berhenti yang sama.
import type { Ruang } from "../app.js";
import { h } from "../dom.js";

export function skrinSentuh(r: Ruang): boolean {
  return typeof matchMedia === "function" && matchMedia(r.k.konfig.sentuh.media).matches;
}

/** Nota cara berhenti di bawah LIHAT, RASA, LENTUR: ayat Esc, atau ayat sentuh + butang Henti. */
export function notaHenti(r: Ruang): HTMLElement {
  const { t } = r.k;
  if (!skrinSentuh(r)) return h("p", { class: "nota" }, t("lihat.esc"));
  return h(
    "p",
    { class: "nota nota-henti", "data-uji": "nota-henti" },
    t("lihat.henti_sentuh"),
    " ",
    h("button", { class: "butang kecil", type: "button", "data-uji": "henti-sentuh", onclick: () => r.berhenti() }, t("lihat.henti")),
  );
}
