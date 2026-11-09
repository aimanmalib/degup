// Keputusan (PRD §4.2): kad = skor RASA + jalur, N/n, perlambatan LENTUR (ms), nisbah nadi-nafas, nadi purata, tarikh.
// "Simpan kad PNG" (tempatan, main menamakan fail), "Main lagi", "Data", "Tetapan". Tiada perkongsian automatik.
// Kamera dan sesi sudah ditutup sebelum skrin ini (app.ts `keKeputusan`).
import { barisKad } from "../../core/lentur.js";
import type { Ruang } from "../app.js";
import { h } from "../dom.js";
import { lukisKad } from "../kad-png.js";
import { pelita } from "./pelita.js";

export function skrinKeputusan(r: Ruang): HTMLElement {
  const { k } = r;
  const { t } = k;
  const kp = r.keputusan!;
  const d = kp.data;
  const lukisSemula = () => k.maklum();

  const simpan = async (e: Event) => {
    const b = e.currentTarget as HTMLButtonElement;
    b.disabled = true;
    try {
      const png = await lukisKad(d, t, k.konfig.kad);
      const h_ = await k.api.simpanKad(png);
      kp.disimpan = h_.ok ? h_.nama : null;
      kp.gagal = !h_.ok;
    } catch {
      kp.gagal = true;
    }
    k.mula.failDitulis = await k.api.failDitulis();
    if (r.keputusan === kp) lukisSemula();
  };

  const status = kp.disimpan
    ? h(
        "p",
        { class: "status-kad", role: "status", "data-uji": "status-kad", "data-nama": kp.disimpan },
        t("keputusan.disimpan", { nama: kp.disimpan }),
        h("button", { class: "pautan", type: "button", onclick: () => void k.api.bukaFolderKad() }, t("keputusan.buka_folder")),
      )
    : h("p", { class: kp.gagal ? "status-kad ralat" : "status-kad", role: "status", "data-uji": "status-kad" }, kp.gagal ? t("keputusan.gagal") : "");

  const kad = h(
    "article",
    { class: "kad", "data-uji": "kad", "aria-labelledby": "kad-tajuk" },
    h(
      "header",
      { class: "kad-kepala" },
      h("span", { class: "tanda" }, h("span", { class: "tanda-titik", "aria-hidden": "true" }), t("app.nama")),
      h("time", { datetime: d.tarikh, "data-uji": "kad-tarikh" }, d.tarikh),
    ),
    h(
      "div",
      { class: "kad-skor" },
      pelita("rehat"),
      h(
        "div",
        { class: "kad-skor-teks" },
        h("p", { class: "skor-label", id: "kad-tajuk" }, t("keputusan.skor")),
        h(
          "p",
          { class: "skor-baris" },
          h("span", { class: "skor-angka", "data-uji": "kad-skor" }, d.skor === null ? "—" : String(d.skor)),
          d.skor === null ? null : h("span", { class: "skor-daripada" }, t("dedah.daripada")),
        ),
        d.jalur
          ? h("p", { class: `jalur jalur-${d.jalur}`, "data-uji": "kad-jalur", "data-jalur": d.jalur }, t(`rasa.jalur.${d.jalur}`))
          : h("p", { class: "jalur jalur-meneka", "data-uji": "kad-jalur", "data-jalur": "" }, t("dedah.tiada_skor")),
      ),
    ),
    h(
      "dl",
      { class: "data kad-data" },
      ...barisKad(d).map((b) =>
        h(
          "div",
          { class: "data-baris", "data-uji": `kad-${b.id}` },
          h("dt", {}, t(b.label)),
          h("dd", {}, b.nilai ? t(b.nilai.kunci, b.nilai.nilai) : t("keputusan.tiada")),
        ),
      ),
    ),
    h("p", { class: "penafian" }, t("umum.penafian")),
  );

  return h(
    "div",
    { class: "keputusan", "data-uji": "keputusan" },
    h("h1", { class: "dedah-tajuk" }, t("keputusan.tajuk")),
    kad,
    h(
      "div",
      { class: "keputusan-tindakan" },
      h("button", { class: "butang utama", type: "button", "data-uji": "simpan-kad", onclick: (e: Event) => void simpan(e) }, t("keputusan.simpan")),
      status,
      h("p", { class: "nota" }, t("keputusan.tempatan")),
      h(
        "div",
        { class: "butang-baris" },
        h("button", { class: "butang", type: "button", "data-uji": "main-lagi", onclick: () => void r.mulaBabak() }, t("keputusan.main_lagi")),
        h("button", { class: "butang hantu", type: "button", onclick: () => r.bukaPanel("data") }, t("nav.data")),
        h("button", { class: "butang hantu", type: "button", onclick: () => r.bukaPanel("tetapan") }, t("nav.tetapan")),
      ),
    ),
  );
}
