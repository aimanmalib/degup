// Butang "Rakam demo" (PRD §4.7, §4.9) untuk Tetapan dan skrin izin, dan petunjuk "RAKAM" bar atas.
// Butang mengemas kini dirinya sendiri bila keadaan perakam berubah; pendengar dilepas bila butang tiada lagi dalam DOM.
import type { Ruang } from "../app.js";
import { h } from "../dom.js";

export function butangRakam(r: Ruang, kelas = "butang hantu"): HTMLElement {
  const { perakam } = r;
  const b = h("button", { class: kelas, type: "button", "data-uji": "rakam-demo" }) as HTMLButtonElement;
  const kemas = () => {
    const k = perakam.keadaan;
    b.textContent = r.k.t(k === "rehat" ? "rakam.mula" : k === "rakam" ? "rakam.henti" : "rakam.tunggu");
    b.disabled = k === "mula" || k === "simpan";
    b.setAttribute("aria-pressed", String(k === "rakam"));
  };
  b.addEventListener("click", () => void (perakam.aktif ? perakam.henti() : perakam.mula()));
  const lepas = perakam.dengar(() => (b.isConnected ? kemas() : lepas()));
  kemas();
  return b;
}

/** Bahagian Tetapan: butang + penjelasan (fail tempatan, tetingkap Degup sahaja, tiada audio) + status terakhir. */
export function bahagianRakam(r: Ruang): HTMLElement {
  const { t } = r.k;
  const status = h("p", { class: "status", role: "status", "data-uji": "rakam-status" });
  const kemas = () => {
    const p = r.perakam;
    status.textContent = p.terakhir ? t("rakam.disimpan", { nama: p.terakhir }) : p.gagal ? t("rakam.gagal") : "";
  };
  const lepas = r.perakam.dengar(() => (status.isConnected ? kemas() : lepas()));
  kemas();
  return h(
    "section",
    { class: "bahagian" },
    h("h3", {}, t("rakam.tajuk")),
    h("p", { class: "bantuan" }, t("rakam.bantuan")),
    butangRakam(r),
    status,
  );
}

/** Petunjuk bar atas: titik merah + "RAKAM" + butang henti, selagi rakaman berjalan. */
export function petunjukRakam(r: Ruang): HTMLElement | null {
  const { t } = r.k;
  if (!r.perakam.aktif && r.perakam.keadaan !== "simpan") return null;
  return h(
    "div",
    { class: "rakam-hidup", role: "status", "data-uji": "rakam-hidup" },
    h("span", { class: "titik", "aria-hidden": "true" }),
    h("span", { class: "rakam-label" }, t("rakam.petunjuk")),
    h(
      "button",
      { class: "butang kecil", type: "button", "data-uji": "rakam-henti", disabled: r.perakam.keadaan !== "rakam", onclick: () => void r.perakam.henti() },
      t("rakam.henti"),
    ),
  );
}
