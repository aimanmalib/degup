// Panel Tetapan (PRD §4.7): bahasa, kamera, kunci API (safeStorage), sumber isyarat, sejarah, bunyi, padam semua, tentang.
// "Rakam demo" ditambah bersama perakam (P4a, D9).
import type { Ruang } from "../app.js";
import { h } from "../dom.js";
import { senaraiKamera } from "../kamera.js";

const bahagian = (tajuk: string, ...isi: Array<Node | null>) =>
  h("section", { class: "bahagian" }, h("h3", {}, tajuk), ...isi);

function suis(id: string, label: string, bantuan: string, hidup: boolean, ubah: (v: boolean) => void): HTMLElement {
  const input = h("input", { type: "checkbox", role: "switch", id, "data-uji": id, checked: hidup, onchange: () => ubah(input.checked) });
  return h(
    "label",
    { class: "baris-suis", for: id },
    h("span", { class: "baris-teks" }, h("span", { class: "baris-label" }, label), h("span", { class: "bantuan" }, bantuan)),
    input,
  );
}

async function bahagianKamera(r: Ruang): Promise<HTMLElement> {
  const { t } = r.k;
  const kamera = await senaraiKamera();
  if (!kamera.length) return bahagian(t("tetapan.kamera"), h("p", { class: "bantuan" }, t("tetapan.kamera_tiada")));
  const pilih = h(
    "select",
    { id: "pilih-kamera", onchange: () => void r.k.ubah({ kamera: pilih.value || null }) },
    h("option", { value: "" }, t("tetapan.kamera_lalai")),
    ...kamera.map((d, i) =>
      h("option", { value: d.deviceId, selected: d.deviceId === r.k.tetapan.kamera }, d.label || t("tetapan.kamera_n", { n: i + 1 })),
    ),
  );
  return bahagian(t("tetapan.kamera"), h("label", { class: "sr", for: "pilih-kamera" }, t("tetapan.kamera")), pilih);
}

function bahagianKunci(r: Ruang): HTMLElement {
  const { t } = r.k;
  const status = h("p", { class: "status", role: "status", "data-uji": "kunci-status" });
  const kawasan = h("div", { class: "kunci" });
  const lukis = (mesej?: string) => {
    status.textContent = mesej ?? "";
    if (r.k.mula.kunciAda) {
      kawasan.replaceChildren(
        h("p", { class: "kunci-ada", "data-uji": "kunci-ada" }, t("tetapan.kunci_ada")),
        h(
          "button",
          {
            class: "butang hantu",
            type: "button",
            onclick: async () => {
              await r.k.api.padamKunci();
              r.k.mula.kunciAda = false;
              lukis(t("tetapan.kunci_dipadam"));
            },
          },
          t("tetapan.kunci_padam"),
        ),
      );
      return;
    }
    const medan = h("input", { type: "password", id: "medan-kunci", "data-uji": "medan-kunci", autocomplete: "off", spellcheck: "false" });
    const borang = h(
      "form",
      {
        class: "kunci-borang",
        onsubmit: async (e: Event) => {
          e.preventDefault();
          const hasil = await r.k.api.simpanKunci(medan.value);
          medan.value = "";
          if (hasil.ok) {
            r.k.mula.kunciAda = true;
            r.k.mula.failDitulis = await r.k.api.failDitulis();
            lukis(t("tetapan.kunci_disimpan"));
          } else lukis(t(hasil.sebab === "kosong" ? "tetapan.kunci_kosong" : "tetapan.kunci_storan"));
        },
      },
      h("label", { class: "sr", for: "medan-kunci" }, t("tetapan.kunci_medan")),
      medan,
      h("button", { class: "butang", type: "submit", "data-uji": "simpan-kunci" }, t("tetapan.kunci_simpan")),
    );
    medan.placeholder = t("tetapan.kunci_medan");
    kawasan.replaceChildren(borang);
  };
  lukis();
  return bahagian(
    t("tetapan.kunci"),
    h("p", { class: "bantuan" }, t("tetapan.kunci_bantuan")),
    kawasan,
    status,
    h("button", { class: "pautan", type: "button", onclick: () => void r.k.api.bukaPautan("kunci_percuma") }, t("tetapan.kunci_dapatkan")),
  );
}

function bahagianSumber(r: Ruang): HTMLElement {
  const { t } = r.k;
  const env = r.k.mula.sumberEnv;
  const radio = (nilai: "live" | "replay") =>
    h(
      "label",
      { class: "pil" },
      h("input", {
        type: "radio",
        name: "sumber",
        value: nilai,
        "data-uji": `sumber-${nilai}`,
        checked: r.k.tetapan.sumber === nilai,
        disabled: env !== null,
        onchange: () => void r.k.ubah({ sumber: nilai }),
      }),
      h("span", {}, t(`tetapan.sumber_${nilai}`)),
    );
  const fx = r.k.mula.fixtures;
  const pilihFx =
    r.k.sumber === "replay"
      ? fx.length
        ? h(
            "select",
            { "aria-label": t("tetapan.fixture"), onchange: (e: Event) => void r.k.ubah({ fixture: (e.target as HTMLSelectElement).value }) },
            ...fx.map((f) =>
              h("option", { value: f.fail, selected: f.fail === r.k.tetapan.fixture }, t("tetapan.fixture_label", { label: f.label, tarikh: f.tarikh })),
            ),
          )
        : h("p", { class: "bantuan" }, t("tetapan.fixture_tiada"))
      : null;
  return bahagian(
    t("tetapan.sumber"),
    h("div", { class: "pil-baris", role: "radiogroup", "aria-label": t("tetapan.sumber") }, radio("live"), radio("replay")),
    env ? h("p", { class: "bantuan", "data-uji": "sumber-env" }, t("tetapan.sumber_env", { sumber: env === "sim" ? t("umum.simulasi") : env })) : null,
    pilihFx,
  );
}

function bahagianPadam(r: Ruang): HTMLElement {
  const { t } = r.k;
  const status = h("p", { class: "status", role: "status", "data-uji": "padam-status" });
  let sahkan = false;
  const butang = h(
    "button",
    {
      class: "butang bahaya",
      type: "button",
      "data-uji": "padam-semua",
      onclick: async () => {
        if (!sahkan) {
          sahkan = true;
          butang.textContent = t("tetapan.padam_sahkan");
          return;
        }
        const dibuang = await r.k.api.padamSemua();
        r.k.mula.kunciAda = false;
        r.k.mula.failDitulis = await r.k.api.failDitulis();
        sahkan = false;
        butang.textContent = t("tetapan.padam");
        status.textContent = t("tetapan.padam_siap", { n: dibuang.length });
      },
    },
    t("tetapan.padam"),
  );
  return bahagian(t("tetapan.padam"), h("p", { class: "bantuan" }, t("tetapan.padam_bantuan")), butang, status);
}

export async function panelTetapan(r: Ruang, tutup: () => void): Promise<HTMLElement> {
  const { t } = r.k;
  const tg = r.k.tetapan;
  const pautan = (id: string, teks: string) => h("button", { class: "pautan", type: "button", onclick: () => void r.k.api.bukaPautan(id) }, teks);
  return h(
    "div",
    { class: "panel", "data-uji": "panel-tetapan" },
    h("div", { class: "panel-kepala" }, h("h2", {}, t("tetapan.tajuk")), h("button", { class: "butang hantu", type: "button", onclick: tutup }, t("umum.tutup"))),
    h(
      "div",
      { class: "panel-badan" },
      bahagian(
        t("bahasa.label"),
        h(
          "div",
          { class: "pil-baris", role: "radiogroup", "aria-label": t("bahasa.label") },
          ...r.k.konfig.bahasa.map((b) =>
            h(
              "label",
              { class: "pil" },
              h("input", { type: "radio", name: "bahasa", value: b, "data-uji": `bahasa-${b}`, checked: tg.bahasa === b, onchange: () => void r.k.ubah({ bahasa: b }) }),
              h("span", { lang: b }, t(`bahasa.${b}_penuh`)),
            ),
          ),
        ),
      ),
      await bahagianKamera(r),
      bahagianKunci(r),
      bahagianSumber(r),
      h(
        "section",
        { class: "bahagian" },
        h("h3", {}, t("umum.pilihan")),
        suis("sejarah", t("tetapan.sejarah"), t("tetapan.sejarah_bantuan"), tg.sejarah, (v) => void r.k.ubah({ sejarah: v })),
        suis("bunyi", t("tetapan.bunyi"), t("tetapan.bunyi_bantuan"), tg.bunyi, (v) => void r.k.ubah({ bunyi: v })),
      ),
      bahagianPadam(r),
      bahagian(
        t("tetapan.tentang"),
        h(
          "p",
          { class: "tentang" },
          h("span", {}, t("tetapan.versi", { v: r.k.mula.versi })),
          pautan("repo", t("tetapan.repo")),
          h("span", {}, t("tetapan.lesen", { lesen: r.k.konfig.pautan.lesen })),
        ),
      ),
    ),
  );
}
