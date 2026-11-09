// Pembantu DOM kecil: tiada rangka kerja UI (PRD §4.11). Teks sentiasa dari i18n, tidak pernah innerHTML.
type Anak = Node | string | null | undefined | false;
type Atribut = Record<string, string | number | boolean | null | undefined | EventListener>;

export function h<K extends keyof HTMLElementTagNameMap>(tag: K, atr: Atribut = {}, ...anak: Anak[]): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(atr)) {
    if (v === null || v === undefined || v === false) continue;
    if (typeof v === "function") el.addEventListener(k.replace(/^on/, ""), v);
    else if (v === true) el.setAttribute(k, "");
    else el.setAttribute(k, String(v));
  }
  for (const a of anak) if (a !== null && a !== undefined && a !== false) el.append(a);
  return el;
}

export function kosongkan(el: Element, ...anak: Anak[]): void {
  el.replaceChildren(...anak.filter((a): a is Node | string => a !== null && a !== undefined && a !== false));
}
