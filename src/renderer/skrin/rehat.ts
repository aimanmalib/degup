// "Tidak sekarang": kamera kekal mati, tiada apa diukur.
import type { Ruang } from "../app.js";
import { h } from "../dom.js";
import { pelita } from "./pelita.js";

export function skrinRehat(r: Ruang): HTMLElement {
  const { t } = r.k;
  return h(
    "div",
    { class: "rehat", "data-uji": "rehat" },
    pelita("rehat"),
    h("h1", {}, t("rehat.tajuk")),
    h("p", {}, t("rehat.teks")),
    h("button", { class: "butang utama", type: "button", onclick: () => r.pergi("izin") }, t("rehat.semula")),
  );
}
