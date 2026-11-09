// Skrin izin (PRD §4.6): tujuh perkara, pautan dasar Presage, kotak 18+, "Hidupkan kamera" / "Tidak sekarang".
// Sebelum getUserMedia. Teks wajib dari lang/ sahaja; jangan ringkaskan.
import type { Ruang } from "../app.js";
import { h } from "../dom.js";
import { pelita } from "./pelita.js";
import { butangRakam } from "./rakam.js";

export const BILANGAN_PERKARA = 7;

/** @param ralat kunci lang ralat mula (kamera tidak dibuka, kunci tiada/ditolak, SDK gagal); null = tiada. */
export function skrinIzin(r: Ruang, ralat: string | null): HTMLElement {
  const { t } = r.k;
  const nota = h("p", { class: "nota", id: "nota-umur", "aria-live": "polite" }, t("izin.umur_perlu"));
  const hidupkan = h(
    "button",
    { class: "butang utama", type: "button", "data-uji": "hidupkan", disabled: true, "aria-describedby": "nota-umur", onclick: () => void r.mulaBabak() },
    t("izin.hidupkan"),
  );
  const kotak = h("input", {
    type: "checkbox",
    id: "umur",
    "data-uji": "umur",
    onchange: () => {
      hidupkan.disabled = !kotak.checked;
      nota.hidden = kotak.checked;
    },
  });
  const perkara = Array.from({ length: BILANGAN_PERKARA }, (_, i) =>
    h(
      "li",
      { class: "perkara" },
      h("h2", {}, t(`izin.perkara.${i + 1}.tajuk`)),
      h("p", {}, t(`izin.perkara.${i + 1}.teks`)),
    ),
  );
  const pautan = (id: string, kunci: string) =>
    h("button", { class: "pautan", type: "button", onclick: () => void r.k.api.bukaPautan(id) }, t(kunci));

  return h(
    "div",
    { class: "izin" },
    h(
      "section",
      { class: "izin-wira", "aria-labelledby": "izin-soalan" },
      pelita("rehat"),
      h("p", { class: "tanda-besar", "aria-hidden": "true" }, t("app.nama")),
      h("p", { class: "soalan", id: "izin-soalan" }, t("app.subtajuk")),
    ),
    h(
      "section",
      { class: "izin-teks", "aria-labelledby": "izin-tajuk" },
      h(
        "div",
        { class: "izin-tatal" },
        h("h1", { id: "izin-tajuk" }, t("izin.tajuk")),
        h("p", { class: "pengenalan" }, t("izin.pengenalan")),
        h("ol", { class: "senarai-izin", "data-uji": "senarai-izin" }, ...perkara),
        h("p", { class: "pautan-baris" }, pautan("dasar_privasi_presage", "izin.pautan_dasar"), pautan("terma_presage", "izin.terma_presage")),
      ),
      h(
        "div",
        { class: "izin-tindakan" },
        ralat ? h("p", { class: "ralat", role: "alert", "data-uji": "ralat-mula" }, t(ralat)) : null,
        h("label", { class: "kotak-umur", for: "umur" }, kotak, h("span", {}, t("izin.umur_kotak"))),
        nota,
        h(
          "div",
          { class: "butang-baris" },
          hidupkan,
          h("button", { class: "butang hantu", type: "button", "data-uji": "tidak-sekarang", onclick: () => r.pergi("rehat") }, t("izin.tidak_sekarang")),
          butangRakam(r),
        ),
        h("p", { class: "penafian" }, t("umum.penafian")),
      ),
    ),
  );
}
