// Pasang `window.degup` versi pelayar SEBELUM renderer dimuat (diimport pertama oleh main.ts).
import konfig from "../../config/app.json";
import { ciptaApiPelayar } from "./api-pelayar.js";

declare const __VERSI__: string;

const w = konfig.sim_web;
window.degup = ciptaApiPelayar(
  {
    bahasa_lalai: konfig.bahasa_lalai,
    bahasa_undur: konfig.bahasa_undur,
    bahasa: konfig.bahasa,
    bunyi_lalai: konfig.rasa.bunyi_lalai,
    kunci_storan: w.kunci_storan,
    param_skala: w.param_skala,
    awalan_kad: konfig.kad.awalan_fail,
    pautan: konfig.pautan as Record<string, string>,
  },
  {
    storan: window.localStorage,
    locale: navigator.language,
    carian: location.search,
    versi: __VERSI__,
    kini: () => new Date(),
    muatTurun(nama, bait) {
      const url = URL.createObjectURL(new Blob([bait as BlobPart], { type: "image/png" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = nama;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    },
    buka: (url) => void window.open(url, "_blank", "noopener"),
  },
);
