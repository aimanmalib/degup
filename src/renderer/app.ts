// Renderer Degup: cangkerang (bar atas, petunjuk kamera, bahasa, Tetapan, Data) + penghala skrin. PRD §4.1, §4.6, §4.7.
import { h, kosongkan } from "./dom.js";
import { Kamera } from "./kamera.js";
import { Keadaan } from "./keadaan.js";
import { SesiUkur } from "./sesi.js";
import { panelData } from "./skrin/data.js";
import { babakDedah } from "./skrin/dedah.js";
import { skrinIzin } from "./skrin/izin.js";
import { babakLihat } from "./skrin/lihat.js";
import { babakRasa } from "./skrin/rasa.js";
import { skrinRehat } from "./skrin/rehat.js";
import { panelTetapan } from "./skrin/tetapan.js";
import { pasangCangkukUji } from "./uji.js";

export type NamaSkrin = "izin" | "rehat" | "lihat" | "rasa" | "dedah";
type NamaBabak = Extract<NamaSkrin, "lihat" | "rasa" | "dedah">;

/** Babak berkeadaan: pemasa + langganan hidup di sini; `el()` membina DOM semula (cth tukar bahasa) tanpa menetap semula keadaan. */
export interface Babak {
  el(): HTMLElement;
  buang(): void;
}

/** Hasil tetingkap RASA untuk pendedahan (µs epoch). */
export interface HasilRasa {
  mula: number;
  akhir: number;
  ketukan: number[];
}

export interface Ruang {
  k: Keadaan;
  kamera: Kamera;
  /** Sesi ukur aktif (LIHAT hingga pendedahan); null di luar babak. */
  sesi: SesiUkur | null;
  hasilRasa: HasilRasa | null;
  readonly skrin: NamaSkrin;
  pergi(skrin: NamaSkrin): void;
  /** Hidupkan sumber: kamera (live) atau tiada kamera (sim/replay), kemudian LIHAT. */
  mulaBabak(): Promise<void>;
  /** Esc / "Matikan kamera": kamera mati serta-merta, kembali ke izin. */
  berhenti(): void;
}

async function utama(): Promise<void> {
  const k = new Keadaan(await window.degup.mula());
  const kamera = new Kamera();
  const akar = document.getElementById("app")!;
  const bar = h("header", { class: "bar" });
  const pentas = h("main", { class: "pentas", id: "pentas", tabindex: "-1" });
  const dialog = h("dialog", { class: "helaian" });
  akar.append(bar, pentas, dialog);
  let skrin: NamaSkrin = "izin";
  let ralatKamera = false;
  let babak: Babak | null = null;
  const BABAK: Record<NamaBabak, (r: Ruang) => Babak> = { lihat: babakLihat, rasa: babakRasa, dedah: babakDedah };

  const ruang: Ruang = {
    k,
    kamera,
    sesi: null,
    hasilRasa: null,
    get skrin() {
      return skrin;
    },
    pergi(s) {
      babak?.buang();
      babak = null;
      skrin = s;
      if (s in BABAK && ruang.sesi) babak = BABAK[s as NamaBabak](ruang);
      lukis();
      pentas.focus({ preventScroll: true });
    },
    async mulaBabak() {
      ralatKamera = false;
      if (k.sumber === "live") {
        try {
          await kamera.buka(k.tetapan.kamera);
        } catch {
          ralatKamera = true;
          lukis();
          return;
        }
      }
      void ruang.sesi?.henti();
      ruang.sesi = await SesiUkur.cipta(k);
      ruang.hasilRasa = null;
      ruang.pergi("lihat");
    },
    berhenti() {
      kamera.tutup();
      void ruang.sesi?.henti();
      ruang.sesi = null;
      ruang.hasilRasa = null;
      ruang.pergi("izin");
    },
  };

  const bukaPanel = (jenis: "tetapan" | "data") => {
    const lukisPanel = async () => {
      kosongkan(dialog, jenis === "tetapan" ? await panelTetapan(ruang, () => dialog.close()) : await panelData(ruang, () => dialog.close()));
    };
    dialog.dataset.panel = jenis;
    void lukisPanel().then(() => {
      if (!dialog.open) dialog.showModal();
    });
  };
  k.dengar(() => {
    if (dialog.open && dialog.dataset.panel) bukaPanel(dialog.dataset.panel as "tetapan" | "data");
  });

  function lukisBar(): void {
    const t = k.t;
    const lencana =
      k.sumber === "sim"
        ? h("span", { class: "lencana", "data-uji": "lencana-sumber" }, t("umum.simulasi"))
        : k.sumber === "replay"
          ? h("span", { class: "lencana", "data-uji": "lencana-sumber" }, t("umum.main_semula", { sesi: labelFixture(k) }))
          : null;
    const petunjuk = kamera.hidup
      ? h(
          "div",
          { class: "kamera-hidup", role: "status", "data-uji": "kamera-hidup" },
          h("span", { class: "titik", "aria-hidden": "true" }),
          t("kamera.hidup"),
          h("button", { class: "butang kecil", type: "button", onclick: () => ruang.berhenti() }, t("kamera.matikan")),
        )
      : null;
    const bahasa = h(
      "div",
      { class: "suis-bahasa", role: "group", "aria-label": t("bahasa.label") },
      ...k.konfig.bahasa.map((b) =>
        h(
          "button",
          {
            type: "button",
            lang: b,
            "aria-pressed": String(k.i18n.bahasa === b),
            "aria-label": t(`bahasa.${b}_penuh`),
            onclick: () => void k.ubah({ bahasa: b }),
          },
          t(`bahasa.${b}`),
        ),
      ),
    );
    kosongkan(
      bar,
      h("span", { class: "tanda", "aria-hidden": "true" }, h("span", { class: "tanda-titik" }), t("app.nama")),
      lencana,
      h("div", { class: "ruang-isi" }),
      petunjuk,
      h(
        "nav",
        { class: "nav", "aria-label": t("nav.utama") },
        bahasa,
        h("button", { class: "butang hantu", type: "button", "data-uji": "buka-tetapan", onclick: () => bukaPanel("tetapan") }, t("nav.tetapan")),
        h("button", { class: "butang hantu", type: "button", "data-uji": "buka-data", onclick: () => bukaPanel("data") }, t("nav.data")),
      ),
    );
  }

  function lukis(): void {
    lukisBar();
    pentas.dataset.skrin = skrin;
    const isi = babak ? babak.el() : skrin === "rehat" ? skrinRehat(ruang) : skrinIzin(ruang, ralatKamera);
    kosongkan(pentas, isi);
  }

  k.dengar(lukis);
  kamera.dengar(lukisBar);
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape" || dialog.open) return;
    if (kamera.hidup || babak) {
      e.preventDefault();
      ruang.berhenti();
    }
  });
  window.addEventListener("beforeunload", () => kamera.tutup());
  pasangCangkukUji(ruang);
  k.maklum();
}

export function labelFixture(k: Keadaan): string {
  const f = k.mula.fixtures.find((x) => x.fail === k.tetapan.fixture) ?? k.mula.fixtures[0];
  return f ? k.t("tetapan.fixture_label", { label: f.label, tarikh: f.tarikh }) : k.t("tetapan.fixture_tiada");
}

void utama();
