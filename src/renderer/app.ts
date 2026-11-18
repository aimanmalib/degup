// Renderer Degup: cangkerang (bar atas, petunjuk kamera, bahasa, Tetapan, Data) + penghala skrin. PRD §4.1, §4.6, §4.7.
import { h, kosongkan } from "./dom.js";
import { Kamera } from "./kamera.js";
import { Keadaan } from "./keadaan.js";
import { PerakamDemo } from "./perakam.js";
import { RalatMulaLive, SesiUkur } from "./sesi.js";
import { panelData } from "./skrin/data.js";
import { babakDedah } from "./skrin/dedah.js";
import { skrinKeputusan } from "./skrin/keputusan.js";
import { babakLentur } from "./skrin/lentur.js";
import { skrinIzin } from "./skrin/izin.js";
import { babakLihat } from "./skrin/lihat.js";
import { babakRasa } from "./skrin/rasa.js";
import { skrinRehat } from "./skrin/rehat.js";
import { petunjukRakam } from "./skrin/rakam.js";
import { panelTetapan } from "./skrin/tetapan.js";
import { pasangCangkukUji } from "./uji.js";
import type { Keputusan } from "../core/lentur.js";
import type { HasilSkor } from "../core/score.js";
import { kunciRalat, type RalatLive } from "../sumber/live.js";

export type NamaSkrin = "izin" | "rehat" | "lihat" | "rasa" | "dedah" | "lentur" | "keputusan";
type NamaBabak = Extract<NamaSkrin, "lihat" | "rasa" | "dedah" | "lentur">;

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
  /** Perakam demo §4.9 (Tetapan, skrin izin, bar atas); berhenti sendiri selepas skrin keputusan. */
  perakam: PerakamDemo;
  /** Sesi ukur aktif (LIHAT hingga pendedahan); null di luar babak. */
  sesi: SesiUkur | null;
  hasilRasa: HasilRasa | null;
  /** Skor pusingan RASA terakhir (pendedahan) untuk kad keputusan. */
  hasilSkor: HasilSkor | null;
  /** Ringkasan sesi selepas LENTUR; skrin keputusan dibina dari sini (sesi + kamera sudah ditutup). */
  keputusan: { data: Keputusan; disimpan: string | null; gagal: boolean } | null;
  readonly skrin: NamaSkrin;
  pergi(skrin: NamaSkrin): void;
  /** Hidupkan sumber: kamera (live) atau tiada kamera (sim/replay), kemudian LIHAT. */
  mulaBabak(): Promise<void>;
  /** Esc / "Matikan kamera": kamera mati serta-merta, kembali ke izin. */
  berhenti(): void;
  /** Tamat LENTUR: simpan keputusan, kamera + sesi mati, skrin keputusan. */
  keKeputusan(data: Keputusan): void;
  bukaPanel(jenis: "tetapan" | "data"): void;
}

async function utama(): Promise<void> {
  const k = new Keadaan(await window.degup.mula());
  const kamera = new Kamera();
  const perakam = new PerakamDemo(k.api, k.konfig.perakam);
  const akar = document.getElementById("app")!;
  const bar = h("header", { class: "bar" });
  const pentas = h("main", { class: "pentas", id: "pentas", tabindex: "-1" });
  const dialog = h("dialog", { class: "helaian" });
  akar.append(bar, pentas, dialog);
  let skrin: NamaSkrin = "izin";
  /** Kunci lang ralat mula (kamera / SDK) yang dipapar skrin izin; null = tiada. */
  let ralatMula: string | null = null;
  let mesejRakam: string | null = null;
  let pemasaMesej: ReturnType<typeof setTimeout> | undefined;
  let pemasaRakam: ReturnType<typeof setTimeout> | undefined;
  let babak: Babak | null = null;
  const BABAK: Record<NamaBabak, (r: Ruang) => Babak> = { lihat: babakLihat, rasa: babakRasa, dedah: babakDedah, lentur: babakLentur };

  const ruang: Ruang = {
    k,
    kamera,
    perakam,
    sesi: null,
    hasilRasa: null,
    hasilSkor: null,
    keputusan: null,
    get skrin() {
      return skrin;
    },
    pergi(s) {
      babak?.buang();
      babak = null;
      skrin = s;
      ruang.sesi?.tandaBabak(s === "lihat" || s === "rasa" || s === "lentur" ? s : null);
      if (s in BABAK && ruang.sesi) babak = BABAK[s as NamaBabak](ruang);
      lukis();
      pentas.focus({ preventScroll: true });
    },
    async mulaBabak() {
      ralatMula = null;
      if (k.sumber === "live") {
        try {
          const strim = await kamera.buka(k.tetapan.kamera, k.konfig.sdk.kamera);
          const trek = strim.getVideoTracks()[0];
          const t = trek?.getSettings() ?? {};
          k.api.diag({ jenis: "kamera", label: trek?.label ?? "", lebar: t.width ?? 0, tinggi: t.height ?? 0, fps: t.frameRate ?? 0 });
        } catch {
          ralatMula = "kamera.ralat";
          lukis();
          return;
        }
      }
      void ruang.sesi?.henti();
      ruang.sesi = null;
      try {
        ruang.sesi = await SesiUkur.cipta(k, kamera.media, ralatLive);
      } catch (e) {
        kamera.tutup();
        ralatMula = kunciRalat(e instanceof RalatMulaLive ? e.sebab : "sdk");
        lukis();
        return;
      }
      ruang.hasilRasa = null;
      ruang.hasilSkor = null;
      ruang.keputusan = null;
      ruang.pergi("lihat");
    },
    berhenti() {
      kamera.tutup();
      void ruang.sesi?.henti();
      ruang.sesi = null;
      ruang.hasilRasa = null;
      ruang.hasilSkor = null;
      ruang.keputusan = null;
      ruang.pergi("izin");
    },
    keKeputusan(data) {
      simpanFixture();
      kamera.tutup();
      void ruang.sesi?.henti();
      ruang.sesi = null;
      ruang.keputusan = { data, disimpan: null, gagal: false };
      ruang.pergi("keputusan");
      // §4.9: rakaman berhenti sendiri selepas kad keputusan kelihatan seketika.
      clearTimeout(pemasaRakam);
      if (perakam.aktif) pemasaRakam = setTimeout(() => void perakam.henti(), k.konfig.perakam.henti_selepas_keputusan_ms);
    },
    bukaPanel: (jenis) => bukaPanel(jenis),
  };

  /** Ralat SDK semasa babak (kunci ditolak, kredit habis, rangkaian, kamera): berhenti dan terangkan di skrin izin. */
  function ralatLive(r: RalatLive): void {
    if (!ruang.sesi) return;
    ruang.berhenti();
    ralatMula = kunciRalat(r);
    lukis();
  }

  /** Perakam fixture §4.10 (live + config.rakam_fixture): angka sesi → main (pengesah skema) → Dokumen/Degup/fixtures. */
  function simpanFixture(): void {
    const d = new Date();
    const p = (x: number) => String(x).padStart(2, "0");
    const tarikh = `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
    const f = ruang.sesi?.fixtureRakaman(ruang.hasilRasa?.ketukan ?? [], k.konfig.replay.skema, `${k.konfig.fixture_rakaman.label_awalan}${tarikh}`, tarikh);
    if (f) void k.api.simpanFixture(f);
  }

  perakam.dengar(() => {
    if (perakam.keadaan === "rehat" && (perakam.terakhir || perakam.gagal)) {
      mesejRakam = perakam.terakhir ? k.t("rakam.disimpan", { nama: perakam.terakhir }) : k.t("rakam.gagal");
      clearTimeout(pemasaMesej);
      pemasaMesej = setTimeout(() => {
        mesejRakam = null;
        lukisBar();
      }, k.konfig.perakam.mesej_ms);
    } else if (perakam.aktif) mesejRakam = null;
    lukisBar();
  });

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
          : h("span", { class: "lencana lencana-langsung", "data-uji": "lencana-sumber" }, t("umum.langsung", { versi: k.konfig.sdk.versi }));
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
      petunjukRakam(ruang),
      mesejRakam ? h("p", { class: "rakam-mesej", role: "status", "data-uji": "rakam-mesej" }, mesejRakam) : null,
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
    const isi = babak
      ? babak.el()
      : skrin === "rehat"
        ? skrinRehat(ruang)
        : skrin === "keputusan" && ruang.keputusan
          ? skrinKeputusan(ruang)
          : skrinIzin(ruang, ralatMula);
    kosongkan(pentas, isi);
  }

  k.dengar(lukis);
  kamera.dengar(lukisBar);
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape" || dialog.open) return;
    if (kamera.hidup || babak || skrin === "keputusan") {
      e.preventDefault();
      ruang.berhenti();
    }
  });
  window.addEventListener("beforeunload", () => {
    kamera.tutup();
    void perakam.henti();
  });
  pasangCangkukUji(ruang);
  k.maklum();
}

export function labelFixture(k: Keadaan): string {
  const f = k.mula.fixtures.find((x) => x.fail === k.tetapan.fixture) ?? k.mula.fixtures[0];
  return f ? k.t("tetapan.fixture_label", { label: f.label, tarikh: f.tarikh }) : k.t("tetapan.fixture_tiada");
}

void utama();
