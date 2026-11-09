// Preload (sandbox, CJS selepas bundle): dedahkan API sempit sahaja. Tiada Node/ipcRenderer mentah ke renderer.
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
};

contextBridge.exposeInMainWorld("degup", api);
