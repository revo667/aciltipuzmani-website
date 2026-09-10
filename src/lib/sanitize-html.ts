import { FilterXSS, type IWhiteList } from "xss";

/**
 * Yazi ve sayfa HTML'i icin allowlist tabanli temizleyici. Yalnizca editorun
 * (TipTap) ve WordPress aktariminin urettigi etiket/nitelikler gecer; geri kalan
 * her sey (script, olay nitelikleri, javascript: adresleri, iframe...) atilir.
 * Saf JS oldugu icin sunucuda (SSR) ve tarayicida ayni sonucu verir.
 */

const ALIGNABLE = ["style"];
const TABLE_CELL = ["colspan", "rowspan", "colwidth", "style"];

const allowList: IWhiteList = {
  a: ["href", "title", "target", "rel"],
  b: [],
  i: [],
  em: [],
  strong: [],
  u: [],
  s: [],
  strike: [],
  del: [],
  ins: [],
  mark: [],
  sub: [],
  sup: [],
  small: [],
  code: [],
  br: [],
  hr: [],
  span: [],
  div: [],
  p: ALIGNABLE,
  h1: ALIGNABLE,
  h2: ALIGNABLE,
  h3: ALIGNABLE,
  h4: ALIGNABLE,
  h5: ALIGNABLE,
  h6: ALIGNABLE,
  blockquote: [],
  pre: [],
  ul: [],
  ol: ["start"],
  li: [],
  figure: [],
  figcaption: [],
  img: ["src", "alt", "title", "width", "height", "loading"],
  table: ["style"],
  caption: [],
  colgroup: [],
  col: ["span", "style"],
  thead: [],
  tbody: [],
  tfoot: [],
  tr: [],
  th: TABLE_CELL,
  td: TABLE_CELL,
};

const filter = new FilterXSS({
  whiteList: allowList,
  // style niteliginde yalnizca hizalama ve tablo genislikleri kalir.
  css: { whiteList: { "text-align": true, width: true, "min-width": true } },
  stripIgnoreTag: true,
  stripIgnoreTagBody: [
    "script",
    "style",
    "iframe",
    "object",
    "embed",
    "noscript",
    "template",
    "svg",
    "math",
  ],
});

export function sanitizeHtml(html: string): string {
  return filter.process(html);
}
