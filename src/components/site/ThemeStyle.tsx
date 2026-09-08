import { defaultSettings, type GeneralSettings } from "@/lib/content";

/**
 * Panelden secilen renk ve yazi tipleri, styles.css'teki temayi ezen bir
 * <style> blogu olarak basilir. Tailwind token'lari (--primary vb.) uzerinden
 * calistigi icin tum bilesenler tek seferde etkilenir.
 */

/** #rrggbb -> "oklch(l c h)". Tarayici destegi genis oldugu icin renk donusumu elle yapilir. */
function hexToOklch(hex: string): string | null {
  const match = /^#([0-9a-f]{6})$/i.exec(hex.trim());
  if (!match) return null;
  const int = parseInt(match[1]!, 16);
  const srgb = [(int >> 16) & 255, (int >> 8) & 255, int & 255].map((v) => v / 255);

  const linear = srgb.map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)) as [
    number,
    number,
    number,
  ];
  const [r, g, b] = linear;

  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);

  const okL = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const okA = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const okB = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;

  const chroma = Math.sqrt(okA * okA + okB * okB);
  const hue = ((Math.atan2(okB, okA) * 180) / Math.PI + 360) % 360;

  return `oklch(${okL.toFixed(4)} ${chroma.toFixed(4)} ${hue.toFixed(2)})`;
}

/** Beyaz mi siyah mi yazilacagini belirler; kontrast icin kaba ama yeterli. */
function readableForeground(hex: string): string {
  const match = /^#([0-9a-f]{6})$/i.exec(hex.trim());
  if (!match) return "oklch(0.99 0.005 220)";
  const int = parseInt(match[1]!, 16);
  const [r, g, b] = [(int >> 16) & 255, (int >> 8) & 255, int & 255];
  const luminance = (0.299 * r! + 0.587 * g! + 0.114 * b!) / 255;
  return luminance > 0.6 ? "oklch(0.22 0.035 250)" : "oklch(0.99 0.005 220)";
}

export function themeCss(settings: GeneralSettings | undefined): string {
  const s = settings ?? defaultSettings;
  const primary = hexToOklch(s.themePrimary);
  const brandDeep = hexToOklch(s.themeBrandDeep);
  const accent = hexToOklch(s.themeAccent);

  const lines = [
    `--radius: ${(s.themeRadius / 16).toFixed(3)}rem;`,
    primary ? `--primary: ${primary};` : "",
    primary ? `--ring: ${primary};` : "",
    primary ? `--primary-foreground: ${readableForeground(s.themePrimary)};` : "",
    brandDeep ? `--brand-deep: ${brandDeep};` : "",
    accent ? `--accent: ${accent};` : "",
    accent ? `--accent-foreground: ${readableForeground(s.themeAccent)};` : "",
  ].filter(Boolean);

  return [
    `:root{${lines.join("")}}`,
    `@theme inline{--font-sans:"${s.fontBody}",ui-sans-serif,system-ui,sans-serif;--font-display:"${s.fontDisplay}",ui-sans-serif,system-ui,sans-serif;}`,
    `body{font-family:"${s.fontBody}",ui-sans-serif,system-ui,sans-serif;}`,
    `h1,h2,h3,.font-display{font-family:"${s.fontDisplay}",ui-sans-serif,system-ui,sans-serif;}`,
  ].join("");
}

/** Panelde secilebilen yazi tiplerinin tamamini tek istekte yukleyen Google Fonts adresi. */
export function fontHref(settings: GeneralSettings | undefined): string {
  const s = settings ?? defaultSettings;
  const families = Array.from(new Set([s.fontDisplay, s.fontBody]));
  const params = families
    .map((family) => `family=${family.replace(/ /g, "+")}:wght@400;500;600;700`)
    .join("&");
  return `https://fonts.googleapis.com/css2?${params}&display=swap`;
}
