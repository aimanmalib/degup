// Panel Data (PRD §4.6): kiraan peristiwa SEBENAR sesi ini ("egress yang diukur", bukan dakwaan).
// Bingkai video dihantar oleh Degup = 0 ialah fakta reka bentuk: renderer tidak mempunyai kod yang menghantar bingkai.
import type { Ruang } from "../app.js";
import { h } from "../dom.js";

export async function panelData(r: Ruang, tutup: () => void): Promise<HTMLElement> {
  const { t } = r.k;
  const fail = await r.k.api.failDitulis();
  const p = r.k.sesi.pengesahan;
  const baris = (id: string, label: string, nilai: Node | string) =>
    h("div", { class: "data-baris", "data-uji": `data-${id}` }, h("dt", {}, label), h("dd", {}, nilai));
  return h(
    "div",
    { class: "panel", "data-uji": "panel-data" },
    h("div", { class: "panel-kepala" }, h("h2", {}, t("data.tajuk")), h("button", { class: "butang hantu", type: "button", onclick: tutup }, t("umum.tutup"))),
    h(
      "div",
      { class: "panel-badan" },
      h("p", { class: "bantuan" }, t("data.pengenalan")),
      r.k.sumber === "live" ? null : h("p", { class: "lencana-panel", "data-uji": "data-simulasi" }, t("data.simulasi")),
      h(
        "dl",
        { class: "data" },
        baris("pengesahan", t("data.pengesahan"), t(p === null ? "data.belum" : p ? "data.ya" : "data.tidak")),
        baris("insight", t("data.insight"), String(r.k.sesi.insight)),
        baris("telemetri", t("data.telemetri"), t(r.k.konfig.sdk.telemetri ? "data.ya" : "data.mati")),
        baris("bingkai", t("data.bingkai"), "0"),
        baris(
          "fail",
          t("data.fail"),
          fail.length ? h("ul", { class: "fail" }, ...fail.map((f) => h("li", {}, h("code", {}, f)))) : t("data.fail_tiada"),
        ),
      ),
    ),
  );
}
