// RASA (PRD §4.2, §4.1): pelita padam, tiada maklum balas tentang degupan. Ketukan Space / klik / sentuh dengan cap masa
// peristiwa (µs epoch, asas sama SDK); bunyi klik lembut (Tetapan). Pembilang halus. Jeda petunjuk membekukan masa;
// jeda melebihi had = pusingan bermula semula selepas OK.
import type { Babak, Ruang } from "../app.js";
import { h } from "../dom.js";
import { kiniUs, masaPeristiwaUs } from "../sesi.js";
import { pelita } from "./pelita.js";
import { kotakPetunjuk, kemasPetunjuk } from "./petunjuk.js";
import { notaHenti, skrinSentuh } from "./sentuh.js";

/** Klik lembut: satu nada pendek dengan sampul eksponen (nilai dari config.rasa.bunyi). */
function pembunyi(kfg: { hz: number; ms: number; gain: number }): () => void {
  let ctx: AudioContext | null = null;
  return () => {
    ctx ??= new AudioContext();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    const t = ctx.currentTime;
    o.frequency.value = kfg.hz;
    g.gain.setValueAtTime(kfg.gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + kfg.ms / 1000);
    o.connect(g).connect(ctx.destination);
    o.start(t);
    o.stop(t + kfg.ms / 1000);
  };
}

export function babakRasa(r: Ruang): Babak {
  const { k } = r;
  const sesi = r.sesi!;
  const kfg = k.konfig;
  const tempohUs = k.masaS(kfg.aliran.rasa_s) * 1e6;
  const hadJedaS = k.masaS(kfg.aliran.jeda_ulang_pusingan_s);
  const bunyi = pembunyi(kfg.rasa.bunyi);
  let mula = kiniUs();
  let tAkhir = mula;
  let berlaluUs = 0;
  let ketukan: number[] = [];
  /** Jeda melebihi had: ketukan dibuang; pusingan baharu bermula bila petunjuk OK. */
  let menungguUlang = false;
  let diulang = false;
  let selesai = false;
  let dom: { akar: HTMLElement; jarum: HTMLElement; petunjuk: HTMLElement; ulang: HTMLElement; riak: HTMLElement } | null = null;

  const ketuk = (t: number) => {
    if (selesai || menungguUlang || sesi.jeda.dijeda) return;
    ketukan.push(t);
    if (k.tetapan.bunyi) bunyi();
    dom?.riak.animate(
      [
        { opacity: 0.5, transform: "scale(0.6)" },
        { opacity: 0, transform: "scale(1.4)" },
      ],
      { duration: kfg.rasa.riak_ms, easing: "ease-out" },
    );
  };
  sesi.rasa = {
    get mula() {
      return mula;
    },
    ketuk,
  };

  const kekunci = (e: KeyboardEvent) => {
    if (e.code !== "Space" || e.repeat || document.querySelector("dialog[open]")) return;
    e.preventDefault();
    ketuk(masaPeristiwaUs(e));
  };
  document.addEventListener("keydown", kekunci);

  function tamat(akhir: number): void {
    selesai = true;
    dom?.akar.setAttribute("data-keadaan", "mengira");
    // Pengesan mengesahkan puncak dengan sedikit lewat: tunggu sebelum mengira supaya degupan terakhir tetingkap masuk.
    setTimeout(() => {
      if (r.sesi !== sesi || r.skrin !== "rasa") return;
      r.hasilRasa = { mula, akhir, ketukan: [...ketukan] };
      r.pergi("dedah");
    }, kfg.rasa.tunggu_akhir_ms);
  }

  function kemas(): void {
    if (selesai) return;
    const kini = kiniUs();
    const dt = kini - tAkhir;
    tAkhir = kini;
    if (sesi.jeda.dijeda) {
      if (!menungguUlang && sesi.jeda.perluUlang(kini, hadJedaS)) {
        menungguUlang = true;
        diulang = true;
        ketukan = [];
        berlaluUs = 0;
      }
    } else if (menungguUlang) {
      menungguUlang = false;
      mula = kini;
    } else {
      berlaluUs += dt;
    }
    if (dom) {
      dom.jarum.style.transform = `scaleX(${Math.max(0, 1 - berlaluUs / tempohUs)})`;
      dom.akar.dataset.keadaan = sesi.jeda.dijeda ? "dijeda" : "mengetuk";
      dom.ulang.hidden = !diulang;
      kemasPetunjuk(dom.petunjuk, k, sesi.jeda);
    }
    if (berlaluUs >= tempohUs) tamat(kini);
  }

  const offJeda = sesi.onJeda(kemas);
  const pemasa = setInterval(kemas, kfg.rasa.kemas_ms);

  return {
    el() {
      const { t } = k;
      const riak = h("span", { class: "riak", "aria-hidden": "true" });
      const p = pelita("padam");
      p.append(riak);
      const jarum = h("span", { class: "pembilang-jarum" });
      const petunjuk = kotakPetunjuk();
      const ulang = h("p", { class: "nota rasa-ulang", "data-uji": "rasa-ulang", hidden: true }, t("rasa.diulang", { s: kfg.aliran.jeda_ulang_pusingan_s }));
      const akar = h(
        "div",
        {
          class: "rasa",
          "data-uji": "rasa",
          onpointerdown: (e: Event) => {
            if ((e.target as Element).closest("button")) return;
            ketuk(masaPeristiwaUs(e));
          },
        },
        h("h1", { class: "sr" }, t("babak.rasa")),
        p,
        petunjuk,
        h("p", { class: "arahan rasa-arahan" }, t(skrinSentuh(r) ? "rasa.arahan_sentuh" : "rasa.arahan")),
        k.sumber === "sim" ? h("p", { class: "nota rasa-nota-sim", "data-uji": "nota-sim" }, t("rasa.nota_sim")) : null,
        ulang,
        h("p", { class: "nota rasa-mengira" }, t("rasa.mengira")),
        h(
          "div",
          { class: "pembilang", role: "timer", "aria-label": t("rasa.pembilang", { s: kfg.aliran.rasa_s }) },
          jarum,
        ),
        notaHenti(r),
      );
      dom = { akar, jarum, petunjuk, ulang, riak };
      kemas();
      return akar;
    },
    buang() {
      clearInterval(pemasa);
      offJeda();
      document.removeEventListener("keydown", kekunci);
      if (sesi.rasa?.ketuk === ketuk) sesi.rasa = null;
      dom = null;
    },
  };
}
