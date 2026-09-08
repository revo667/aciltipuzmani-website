import { defaultSettings, type GeneralSettings } from "@/lib/content";

/**
 * Tum sayfalarin meta etiketlerini tek yerden uretir. Baslik, aciklama ve
 * paylasim gorseli panelden yonetilir; sayfa kendi degerini verirse o kazanir.
 */

export type PageMetaInput = {
  /** Sayfaya ozel baslik. Verilmezse site basligi kullanilir. */
  title?: string | undefined;
  description?: string | undefined;
  image?: string | undefined;
  /** "article" yazilar ve sayfalar icin, "website" listeler icin. */
  type?: "website" | "article" | undefined;
  /** Yazi/sayfa bulunamadiginda arama motorlarina indeksleme dedirtmemek icin. */
  noindex?: boolean | undefined;
  /** Yayin tarihi (article icin). */
  publishedTime?: string | null | undefined;
};

type MetaTag = Record<string, string>;

function clamp(value: string, limit = 160) {
  const clean = value.replace(/\s+/g, " ").trim();
  return clean.length > limit ? `${clean.slice(0, limit - 1).trimEnd()}…` : clean;
}

export function pageMeta(
  settings: GeneralSettings | undefined,
  input: PageMetaInput = {},
): { meta: MetaTag[]; links?: { rel: string; href: string }[] } {
  const s = settings ?? defaultSettings;
  const siteName = s.siteName || defaultSettings.siteName;

  const title = input.title ? `${input.title} — ${siteName}` : s.seoTitle || siteName;
  const description = clamp(input.description || s.seoDescription || s.tagline);
  const image = input.image || s.seoOgImageUrl || "";
  const noindex = input.noindex || s.seoNoindex;

  const meta: MetaTag[] = [
    { title },
    { name: "description", content: description },
    { property: "og:title", content: input.title || title },
    { property: "og:description", content: description },
    { property: "og:type", content: input.type ?? "website" },
    { property: "og:site_name", content: siteName },
    { property: "og:locale", content: "tr_TR" },
    { name: "twitter:card", content: image ? "summary_large_image" : "summary" },
  ];

  if (image) {
    meta.push({ property: "og:image", content: image });
    meta.push({ name: "twitter:image", content: image });
  }
  if (s.twitterHandle) {
    const handle = s.twitterHandle.startsWith("@") ? s.twitterHandle : `@${s.twitterHandle}`;
    meta.push({ name: "twitter:site", content: handle });
  }
  if (input.publishedTime) {
    meta.push({ property: "article:published_time", content: input.publishedTime });
  }
  if (noindex) {
    meta.push({ name: "robots", content: "noindex" });
  }

  return { meta };
}
