// LIHAT, keadaan awal (PRD §4.2): pratonton dicermin + pelita "Membaca nadi…". Denyut, BPM dan "Sedia" = P3b.
import type { Ruang } from "../app.js";
import { h } from "../dom.js";
import { pelita } from "./pelita.js";

export function skrinLihat(r: Ruang): HTMLElement {
  const { t } = r.k;
  let pratonton: HTMLElement;
  if (r.kamera.media) {
    const v = h("video", { class: "pratonton", autoplay: true, muted: true, playsinline: true, "aria-label": t("kamera.pratonton") });
    v.srcObject = r.kamera.media;
    pratonton = v;
  } else {
    pratonton = h("div", { class: "pratonton pratonton-kosong", "data-uji": "pratonton-sim" }, t("kamera.simulasi"));
  }
  return h(
    "div",
    { class: "lihat", "data-uji": "lihat" },
    pratonton,
    pelita("membaca"),
    h("p", { class: "status-baca", role: "status" }, t("lihat.membaca")),
    h("p", { class: "arahan" }, t("lihat.arahan")),
    h("p", { class: "nota" }, t("lihat.esc")),
  );
}
