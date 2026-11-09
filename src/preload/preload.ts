// Preload (sandbox, CJS selepas bundle): dedahkan API sempit sahaja. Tiada Node/ipcRenderer mentah ke renderer.
// Jambatan SDK rasmi (`window.__smartspectraBridge`, MessagePort ke main) dibundel dari pakej SDK (corak electron-quickstart).
import "@smartspectra/node-sdk/preload";
import { contextBridge, ipcRenderer } from "electron";
import { SALURAN, type DegupApi } from "./api.js";

const api: DegupApi = {
  mula: () => ipcRenderer.invoke(SALURAN.mula),
  simpanTetapan: (ubah) => ipcRenderer.invoke(SALURAN.simpanTetapan, ubah),
  simpanKunci: (kunci) => ipcRenderer.invoke(SALURAN.simpanKunci, kunci),
  padamKunci: () => ipcRenderer.invoke(SALURAN.padamKunci),
  padamSemua: () => ipcRenderer.invoke(SALURAN.padamSemua),
  failDitulis: () => ipcRenderer.invoke(SALURAN.failDitulis),
  bukaPautan: (id) => ipcRenderer.invoke(SALURAN.bukaPautan, id),
  bacaFixture: (fail) => ipcRenderer.invoke(SALURAN.bacaFixture, fail),
  simpanKad: (png) => ipcRenderer.invoke(SALURAN.simpanKad, png),
  bukaFolderKad: () => ipcRenderer.invoke(SALURAN.bukaFolderKad),
  sediaLive: () => ipcRenderer.invoke(SALURAN.sediaLive),
  rakamMula: () => ipcRenderer.invoke(SALURAN.rakamMula),
  rakamTulis: (bait) => ipcRenderer.invoke(SALURAN.rakamTulis, bait),
  rakamTamat: () => ipcRenderer.invoke(SALURAN.rakamTamat),
  simpanFixture: (data) => ipcRenderer.invoke(SALURAN.simpanFixture, data),
};

contextBridge.exposeInMainWorld("degup", api);
