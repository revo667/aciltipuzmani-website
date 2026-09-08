import { supabase } from "@/integrations/supabase/client";

export type Post = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  cover_url: string | null;
  category: string;
  status: string;
  published_at: string | null;
  created_at: string;
  seo_title: string | null;
  seo_description: string | null;
  og_image_url: string | null;
};

export type EventItem = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  location: string | null;
  city: string | null;
  starts_at: string;
  ends_at: string | null;
  registration_url: string | null;
  cover_url: string | null;
  featured: boolean;
  status: string;
  created_at: string;
};

export type LinkItem = {
  id: string;
  name: string;
  url: string;
  logo_url: string | null;
  kind: string;
  sort_order: number;
};

export type ExternalArticle = {
  id: string;
  title: string;
  url: string;
  source_name: string;
  cover_url: string | null;
  tags: string[];
  status: string;
  sort_order: number;
  created_at: string;
};

export type GeneralSettings = {
  siteName: string;
  tagline: string;
  announcement: string;
  heroTitle: string;
  heroSubtitle: string;
  contactEmail: string;
  showAnnouncement: boolean;
  newsTitle: string;
  newsSubtitle: string;
  externalTitle: string;
  externalSubtitle: string;
  externalAllUrl: string;
  eventsTitle: string;
  eventsSubtitle: string;
  linksTitle: string;
  linksSubtitle: string;
  maintenanceMode: boolean;
  maintenanceTitle: string;
  maintenanceMessage: string;

  /* Anasayfa — vitrin (ust buyuk gorseller) */
  homeFeaturedEnabled: boolean;
  homeFeaturedCount: number;
  /** Bos dizi = tum kategoriler. */
  homeFeaturedCategories: string[];

  /* Anasayfa — son yazilar akisi */
  homeFeedEnabled: boolean;
  homeFeedColumns: number;
  homeFeedRows: number;
  /** Bos dizi = tum kategoriler. */
  homeFeedCategories: string[];
  homeFeedIncludeEvents: boolean;
  homeFeedIncludeExternal: boolean;
  homeFeedOrder: HomeFeedOrder;

  /* Anasayfa — diger bolumler */
  homeExternalEnabled: boolean;
  homeEventsEnabled: boolean;
  homeEventsLimit: number;
  homeLinksEnabled: boolean;

  /* Marka — logo, favicon, basliktaki metin */
  logoUrl: string;
  faviconUrl: string;
  /** Header'daki logonun yuksekligi, piksel. */
  logoHeight: number;
  showBrandText: boolean;

  /* Tema — renkler, kose yuvarlakligi, yazi tipleri */
  themePrimary: string;
  themeBrandDeep: string;
  themeAccent: string;
  /** Kose yuvarlakligi, piksel. */
  themeRadius: number;
  fontDisplay: string;
  fontBody: string;

  /* SEO & analitik */
  seoTitle: string;
  seoDescription: string;
  seoOgImageUrl: string;
  twitterHandle: string;
  gaMeasurementId: string;
  searchConsoleToken: string;
  /** Acikken tum siteye noindex verilir; yayina hazirlik icin. */
  seoNoindex: boolean;

  /* Alt bilgi (footer) */
  footerAbout: string;
  footerColumns: FooterColumn[];
  socialLinks: SocialLink[];
  contactPhone: string;
  contactAddress: string;
  /** "{yil}" yerine icinde bulunulan yil yazilir. */
  copyright: string;

  /* Kaynak sayfasi altindaki sorumluluk metni */
  showDisclaimer: boolean;
  disclaimerText: string;

  /* Hata sayfalari */
  notFoundTitle: string;
  notFoundMessage: string;
  notFoundButton: string;
  errorTitle: string;
  errorMessage: string;

  /* Dernek & yayin bolum basliklari */
  linkGroups: LinkGroup[];

  /* Site ici arama */
  searchEnabled: boolean;
};

export type NavLink = { label: string; href: string };
export type FooterColumn = { title: string; links: NavLink[] };
export type SocialKind =
  "facebook" | "x" | "instagram" | "youtube" | "linkedin" | "whatsapp" | "telegram";
export type SocialLink = { kind: SocialKind; url: string };
export type LinkGroup = { kind: string; title: string };

export const socialKinds: SocialKind[] = [
  "facebook",
  "x",
  "instagram",
  "youtube",
  "linkedin",
  "whatsapp",
  "telegram",
];

export const socialLabels: Record<SocialKind, string> = {
  facebook: "Facebook",
  x: "X (Twitter)",
  instagram: "Instagram",
  youtube: "YouTube",
  linkedin: "LinkedIn",
  whatsapp: "WhatsApp",
  telegram: "Telegram",
};

/** Panelde secilebilen yazi tipleri; hepsi Google Fonts uzerinden yuklenir. */
export const fontOptions = [
  "Sora",
  "Manrope",
  "Inter",
  "Poppins",
  "Nunito Sans",
  "Roboto",
  "Merriweather",
  "Lora",
] as const;

/** Son yazilar siralamasi: yayin tarihine gore ya da kategori sirasina gore. */
export type HomeFeedOrder = "date" | "category";

export const defaultSettings: GeneralSettings = {
  siteName: "Acil Tıp Uzmanı",
  tagline: "Acil Tıp Buluşma Noktası",
  announcement: "",
  heroTitle: "Acil Tıbbın Nabzı",
  heroSubtitle: "Türkiye acil tıp camiasının haber, etkinlik ve yayın merkezi.",
  contactEmail: "info@aciltipuzmani.com",
  showAnnouncement: false,
  newsTitle: "Son haberler",
  newsSubtitle: "Klinik pratik, eğitim ve camiadan güncel gelişmeler.",
  externalTitle: "Acil Tıp Web Sitelerinden",
  externalSubtitle: "",
  externalAllUrl: "",
  eventsTitle: "Yaklaşan etkinlikler",
  eventsSubtitle: "Kongreler, kurslar, sempozyumlar.",
  linksTitle: "Dernekler ve yayınlar",
  linksSubtitle: "Acil tıp camiasının dernekleri ve hakemli dergilerine hızlı erişim.",
  maintenanceMode: false,
  maintenanceTitle: "Kısa bir bakımdayız",
  maintenanceMessage:
    "Siteyi daha iyi hale getirmek için kısa bir ara verdik. Kısa süre içinde yeniden buradayız.",

  homeFeaturedEnabled: true,
  homeFeaturedCount: 3,
  homeFeaturedCategories: [],

  homeFeedEnabled: true,
  homeFeedColumns: 3,
  homeFeedRows: 4,
  homeFeedCategories: [],
  homeFeedIncludeEvents: false,
  homeFeedIncludeExternal: true,
  homeFeedOrder: "date",

  homeExternalEnabled: true,
  homeEventsEnabled: true,
  homeEventsLimit: 15,
  homeLinksEnabled: true,

  logoUrl: "/logo.png",
  faviconUrl: "/favicon.ico",
  logoHeight: 72,
  showBrandText: true,

  themePrimary: "#2b7f95",
  themeBrandDeep: "#22314f",
  themeAccent: "#cbe9ef",
  themeRadius: 12,
  fontDisplay: "Sora",
  fontBody: "Manrope",

  seoTitle: "Acil Tıp Uzmanı — Acil Tıbbın Nabzı",
  seoDescription:
    "Türkiye acil tıp camiası için haber, kılavuz, kongre takvimi ve dernek kaynakları.",
  seoOgImageUrl: "",
  twitterHandle: "",
  gaMeasurementId: "",
  searchConsoleToken: "",
  seoNoindex: false,

  footerAbout: "Acil Tıp Buluşma Noktası — haber, etkinlik ve yayın arşivi.",
  footerColumns: [
    {
      title: "Bölümler",
      links: [
        { label: "Haberler", href: "/haberler" },
        { label: "Etkinlikler", href: "/etkinlikler" },
        { label: "Dernekler & Yayınlar", href: "/kaynaklar" },
      ],
    },
  ],
  socialLinks: [],
  contactPhone: "",
  contactAddress: "",
  copyright: "© {yil} Acil Tıp Uzmanı. Tüm hakları saklıdır.",

  showDisclaimer: true,
  disclaimerText:
    "Sitede yer alan yazılar bilgi amaçlı olup, hastalar için kullanılmamalıdır. Her hasta kendine özeldir.",

  notFoundTitle: "Sayfa bulunamadı",
  notFoundMessage: "Aradığınız sayfa taşınmış ya da hiç var olmamış olabilir.",
  notFoundButton: "Anasayfaya dön",
  errorTitle: "Bu sayfa yüklenemedi",
  errorMessage: "Bir aksilik oldu. Sayfayı yenilemeyi ya da anasayfaya dönmeyi deneyebilirsiniz.",

  linkGroups: [
    { kind: "yayin", title: "Acil Tıp Derneklerinin Yayınları" },
    { kind: "dernek", title: "Acil Tıp Dernekleri" },
    { kind: "klinik", title: "Acil Tıp Klinikleri Web Siteleri" },
    { kind: "kaynak", title: "Acil Tıp Web Siteleri" },
  ],

  searchEnabled: true,
};

/** Anasayfa icin cekilen yazi havuzu. Kategori filtresi sonrasi yeterli kart kalsin diye genis tutulur. */
export const HOME_POST_POOL = 60;

export const postsQuery = (limit?: number) => ({
  queryKey: ["posts", "published", limit ?? "all"],
  queryFn: async (): Promise<Post[]> => {
    let q = supabase
      .from("posts")
      .select("*")
      .eq("status", "published")
      .order("published_at", { ascending: false, nullsFirst: false });
    if (limit) q = q.limit(limit);
    const { data, error } = await q;
    if (error) throw error;
    return (data ?? []) as Post[];
  },
});

/** Anasayfa/liste kartlari icin yazinin govdesi cekilmez. */
export type PostCard = Pick<
  Post,
  "id" | "title" | "slug" | "excerpt" | "cover_url" | "category" | "published_at" | "created_at"
>;

const postCardColumns = "id,title,slug,excerpt,cover_url,category,published_at,created_at";

export const postCardsQuery = (limit: number) => ({
  queryKey: ["posts", "cards", limit],
  queryFn: async (): Promise<PostCard[]> => {
    const { data, error } = await supabase
      .from("posts")
      .select(postCardColumns)
      .eq("status", "published")
      .order("published_at", { ascending: false, nullsFirst: false })
      .limit(limit);
    if (error) throw error;
    return (data ?? []) as PostCard[];
  },
});

export const postQuery = (slug: string) => ({
  queryKey: ["post", slug],
  queryFn: async (): Promise<Post | null> => {
    const { data, error } = await supabase.from("posts").select("*").eq("slug", slug).maybeSingle();
    if (error) throw error;
    return (data ?? null) as Post | null;
  },
});

export const eventsQuery = (limit?: number) => ({
  queryKey: ["events", "published", limit ?? "all"],
  queryFn: async (): Promise<EventItem[]> => {
    let q = supabase
      .from("events")
      .select("*")
      .eq("status", "published")
      .order("starts_at", { ascending: true });
    if (limit) q = q.limit(limit);
    const { data, error } = await q;
    if (error) throw error;
    return (data ?? []) as EventItem[];
  },
});

export const linksQuery = () => ({
  queryKey: ["links"],
  queryFn: async (): Promise<LinkItem[]> => {
    const { data, error } = await supabase
      .from("links")
      .select("*")
      .order("sort_order", { ascending: true });
    if (error) throw error;
    return (data ?? []) as LinkItem[];
  },
});

export const externalArticlesQuery = () => ({
  queryKey: ["external_articles"],
  queryFn: async (): Promise<ExternalArticle[]> => {
    const { data, error } = await supabase
      .from("external_articles")
      .select("*")
      .eq("status", "published")
      .order("sort_order", { ascending: true });
    if (error) throw error;
    return (data ?? []) as ExternalArticle[];
  },
});

export type PageItem = {
  id: string;
  slug: string;
  title: string;
  content: string;
  excerpt: string | null;
  cover_url: string | null;
  status: string;
  sort_order: number;
  seo_title: string | null;
  seo_description: string | null;
  og_image_url: string | null;
};

export type MenuItem = {
  id: string;
  label: string;
  href: string;
  sort_order: number;
  visible: boolean;
};

export const pagesQuery = () => ({
  queryKey: ["pages", "published"],
  queryFn: async (): Promise<PageItem[]> => {
    const { data, error } = await supabase
      .from("pages")
      .select("*")
      .eq("status", "published")
      .order("sort_order", { ascending: true });
    if (error) throw error;
    return (data ?? []) as PageItem[];
  },
});

export const pageQuery = (slug: string) => ({
  queryKey: ["page", slug],
  queryFn: async (): Promise<PageItem | null> => {
    const { data, error } = await supabase.from("pages").select("*").eq("slug", slug).maybeSingle();
    if (error) throw error;
    return (data ?? null) as PageItem | null;
  },
});

export const menuQuery = () => ({
  queryKey: ["menu_items"],
  queryFn: async (): Promise<MenuItem[]> => {
    const { data, error } = await supabase
      .from("menu_items")
      .select("*")
      .eq("visible", true)
      .order("sort_order", { ascending: true });
    if (error) throw error;
    return (data ?? []) as MenuItem[];
  },
});

/** JSON'dan gelen degeri string dizisine indirger; bozuk kayitta varsayilana doner. */
function asSlugList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.length > 0);
}

/** JSON'dan gelen sayiyi verilen araliga sikistirir. */
function asBoundedNumber(value: unknown, fallback: number, min: number, max: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, Math.round(parsed)));
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

/** Panelde renk girisi hex; bozuk deger tema degiskenini kirmasin diye dogrulanir. */
function asHexColor(value: unknown, fallback: string): string {
  return typeof value === "string" && /^#[0-9a-fA-F]{6}$/.test(value.trim())
    ? value.trim().toLowerCase()
    : fallback;
}

/** Yalnizca site ici (/...) ya da tam URL kabul edilir; "javascript:" gibi seyler elenir. */
function asSafeHref(value: unknown, fallback = "/"): string {
  const raw = asString(value).trim();
  if (raw.startsWith("/") || raw.startsWith("#")) return raw;
  if (/^https?:\/\//i.test(raw) || /^mailto:/i.test(raw) || /^tel:/i.test(raw)) return raw;
  return fallback;
}

function asNavLinks(value: unknown): NavLink[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null)
    .map((item) => ({ label: asString(item["label"]), href: asSafeHref(item["href"]) }))
    .filter((link) => link.label.length > 0);
}

function asFooterColumns(value: unknown, fallback: FooterColumn[]): FooterColumn[] {
  if (!Array.isArray(value)) return fallback;
  return value
    .filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null)
    .map((item) => ({ title: asString(item["title"]), links: asNavLinks(item["links"]) }));
}

function asSocialLinks(value: unknown): SocialLink[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null)
    .map((item) => ({
      kind: socialKinds.includes(item["kind"] as SocialKind)
        ? (item["kind"] as SocialKind)
        : "facebook",
      url: asString(item["url"]).trim(),
    }))
    .filter((link) => /^https?:\/\//i.test(link.url));
}

/** Bolum anahtari (kind) URL'de kullanildigi icin slug bicimine zorlanir. */
function asLinkGroups(value: unknown, fallback: LinkGroup[]): LinkGroup[] {
  if (!Array.isArray(value)) return fallback;
  const groups = value
    .filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null)
    .map((item) => ({ kind: slugify(asString(item["kind"])), title: asString(item["title"]) }))
    .filter((group) => group.kind.length > 0 && group.title.length > 0);
  return groups.length > 0 ? groups : fallback;
}

/** Panelden gelen JSON eksik ya da bozuk olsa da anasayfa calisir durumda kalsin. */
function normalizeSettings(raw: Partial<GeneralSettings>): GeneralSettings {
  const merged = { ...defaultSettings, ...raw };
  return {
    ...merged,
    homeFeaturedCount: asBoundedNumber(merged.homeFeaturedCount, 3, 1, 6),
    homeFeaturedCategories: asSlugList(merged.homeFeaturedCategories),
    homeFeedColumns: asBoundedNumber(merged.homeFeedColumns, 3, 2, 4),
    homeFeedRows: asBoundedNumber(merged.homeFeedRows, 4, 1, 8),
    homeFeedCategories: asSlugList(merged.homeFeedCategories),
    homeFeedOrder: merged.homeFeedOrder === "category" ? "category" : "date",
    homeEventsLimit: asBoundedNumber(merged.homeEventsLimit, 15, 3, 40),

    logoUrl: asString(merged.logoUrl, defaultSettings.logoUrl),
    faviconUrl: asString(merged.faviconUrl, defaultSettings.faviconUrl),
    logoHeight: asBoundedNumber(merged.logoHeight, defaultSettings.logoHeight, 24, 140),

    themePrimary: asHexColor(merged.themePrimary, defaultSettings.themePrimary),
    themeBrandDeep: asHexColor(merged.themeBrandDeep, defaultSettings.themeBrandDeep),
    themeAccent: asHexColor(merged.themeAccent, defaultSettings.themeAccent),
    themeRadius: asBoundedNumber(merged.themeRadius, defaultSettings.themeRadius, 0, 28),
    fontDisplay: fontOptions.includes(merged.fontDisplay as (typeof fontOptions)[number])
      ? merged.fontDisplay
      : defaultSettings.fontDisplay,
    fontBody: fontOptions.includes(merged.fontBody as (typeof fontOptions)[number])
      ? merged.fontBody
      : defaultSettings.fontBody,

    footerColumns: asFooterColumns(merged.footerColumns, defaultSettings.footerColumns),
    socialLinks: asSocialLinks(merged.socialLinks),
    linkGroups: asLinkGroups(merged.linkGroups, defaultSettings.linkGroups),
  };
}

export const settingsQuery = () => ({
  queryKey: ["site_settings", "general"],
  queryFn: async (): Promise<GeneralSettings> => {
    const { data, error } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "general")
      .maybeSingle();
    if (error) throw error;
    return normalizeSettings((data?.value as Partial<GeneralSettings>) ?? {});
  },
});

export function slugify(input: string) {
  const map: Record<string, string> = {
    ç: "c",
    Ç: "c",
    ğ: "g",
    Ğ: "g",
    ı: "i",
    İ: "i",
    ö: "o",
    Ö: "o",
    ş: "s",
    Ş: "s",
    ü: "u",
    Ü: "u",
  };
  return input
    .split("")
    .map((ch) => map[ch] ?? ch)
    .join("")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function formatDate(value: string | null) {
  if (!value) return "";
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "long",
    timeZone: "Europe/Istanbul",
  }).format(new Date(value));
}

/** Etkinlik tarih araligi: "15-18 Kasim 2026" / "28 Ekim - 2 Kasim 2026". Saat gostermez. */
export function formatDateRange(start: string | null, end?: string | null) {
  if (!start) return "";
  if (!end) return formatDate(start);
  const a = new Date(start);
  const b = new Date(end);
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return formatDate(start);
  const part = (d: Date, opts: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat("tr-TR", { timeZone: "Europe/Istanbul", ...opts }).format(d);
  const [dayA, dayB] = [part(a, { day: "numeric" }), part(b, { day: "numeric" })];
  const [monthA, monthB] = [part(a, { month: "long" }), part(b, { month: "long" })];
  const [yearA, yearB] = [part(a, { year: "numeric" }), part(b, { year: "numeric" })];
  if (yearA === yearB && monthA === monthB) {
    return dayA === dayB ? formatDate(start) : `${dayA}-${dayB} ${monthA} ${yearA}`;
  }
  if (yearA === yearB) return `${dayA} ${monthA} - ${dayB} ${monthB} ${yearA}`;
  return `${formatDate(start)} - ${formatDate(end)}`;
}

export function formatDateTime(value: string | null) {
  if (!value) return "";
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Europe/Istanbul",
  }).format(new Date(value));
}

/* ── Kategori & etiket ─────────────────────────────────────────────── */

export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sort_order: number;
};

export type Tag = {
  id: string;
  name: string;
  slug: string;
};

export const categoriesQuery = () => ({
  queryKey: ["categories"],
  queryFn: async (): Promise<Category[]> => {
    const { data, error } = await supabase
      .from("categories")
      .select("id,name,slug,description,sort_order")
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });
    if (error) throw error;
    return (data ?? []) as Category[];
  },
});

export const tagsQuery = () => ({
  queryKey: ["tags"],
  queryFn: async (): Promise<Tag[]> => {
    const { data, error } = await supabase
      .from("tags")
      .select("id,name,slug")
      .order("name", { ascending: true });
    if (error) throw error;
    return (data ?? []) as Tag[];
  },
});

/** Anasayfanin kategori filtresi/siralamasi icin ihtiyac duydugu tek seferlik esleme. */
export type HomeTaxonomy = {
  /** slug -> gorunen ad ve sira */
  terms: Record<string, { name: string; sortOrder: number }>;
  /** yazi kimligi -> kategori slug listesi */
  byPost: Record<string, string[]>;
};

const emptyHomeTaxonomy: HomeTaxonomy = { terms: {}, byPost: {} };

/**
 * Taksonomi tablolari henuz olusmamissa bos doner; anasayfa hata vermek yerine
 * filtresiz calismaya devam eder.
 */
export const homeTaxonomyQuery = () => ({
  queryKey: ["home_taxonomy"],
  queryFn: async (): Promise<HomeTaxonomy> => {
    const [cats, links] = await Promise.all([
      supabase.from("categories").select("id,name,slug,sort_order"),
      supabase.from("post_categories").select("post_id,category_id"),
    ]);
    if (cats.error || links.error) return emptyHomeTaxonomy;

    const terms: HomeTaxonomy["terms"] = {};
    const slugById = new Map<string, string>();
    for (const row of cats.data ?? []) {
      slugById.set(row.id, row.slug);
      terms[row.slug] = { name: row.name, sortOrder: row.sort_order ?? 0 };
    }

    const byPost: HomeTaxonomy["byPost"] = {};
    for (const row of links.data ?? []) {
      const slug = slugById.get(row.category_id);
      if (!slug) continue;
      (byPost[row.post_id] ??= []).push(slug);
    }
    return { terms, byPost };
  },
});

/** Yazinin kategori slug'lari; taksonomi bagi yoksa eski `posts.category` sutununa duser. */
export function categorySlugsOf(
  post: { id: string; category: string },
  taxonomy: HomeTaxonomy,
): string[] {
  const linked = taxonomy.byPost[post.id];
  if (linked && linked.length > 0) return linked;
  return post.category ? [post.category] : [];
}

export type Taxonomy = { categoryIds: string[]; tagIds: string[] };

const emptyTaxonomy: Taxonomy = { categoryIds: [], tagIds: [] };

/** Bir yazinin kategori ve etiket kimlikleri. */
export const postTaxonomyQuery = (id: string | undefined) => ({
  queryKey: ["post_taxonomy", id ?? ""],
  enabled: Boolean(id),
  queryFn: async (): Promise<Taxonomy> => {
    if (!id) return emptyTaxonomy;
    const [cats, tags] = await Promise.all([
      supabase.from("post_categories").select("category_id").eq("post_id", id),
      supabase.from("post_tags").select("tag_id").eq("post_id", id),
    ]);
    if (cats.error) throw cats.error;
    if (tags.error) throw tags.error;
    return {
      categoryIds: (cats.data ?? []).map((r) => r.category_id),
      tagIds: (tags.data ?? []).map((r) => r.tag_id),
    };
  },
});

/** Bir sayfanin kategori ve etiket kimlikleri. */
export const pageTaxonomyQuery = (id: string | undefined) => ({
  queryKey: ["page_taxonomy", id ?? ""],
  enabled: Boolean(id),
  queryFn: async (): Promise<Taxonomy> => {
    if (!id) return emptyTaxonomy;
    const [cats, tags] = await Promise.all([
      supabase.from("page_categories").select("category_id").eq("page_id", id),
      supabase.from("page_tags").select("tag_id").eq("page_id", id),
    ]);
    if (cats.error) throw cats.error;
    if (tags.error) throw tags.error;
    return {
      categoryIds: (cats.data ?? []).map((r) => r.category_id),
      tagIds: (tags.data ?? []).map((r) => r.tag_id),
    };
  },
});

export type ArchiveResult = {
  term: { name: string; slug: string; description: string | null } | null;
  posts: Post[];
  pages: PageItem[];
};

async function publishedPosts(ids: string[]): Promise<Post[]> {
  if (ids.length === 0) return [];
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .in("id", ids)
    .eq("status", "published")
    .order("published_at", { ascending: false, nullsFirst: false });
  if (error) throw error;
  return (data ?? []) as Post[];
}

async function publishedPages(ids: string[]): Promise<PageItem[]> {
  if (ids.length === 0) return [];
  const { data, error } = await supabase
    .from("pages")
    .select("*")
    .in("id", ids)
    .eq("status", "published")
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data ?? []) as PageItem[];
}

export const categoryArchiveQuery = (slug: string) => ({
  queryKey: ["archive", "category", slug],
  queryFn: async (): Promise<ArchiveResult> => {
    const { data: term, error } = await supabase
      .from("categories")
      .select("id,name,slug,description")
      .eq("slug", slug)
      .maybeSingle();
    if (error) throw error;
    if (!term) return { term: null, posts: [], pages: [] };

    const [postRel, pageRel] = await Promise.all([
      supabase.from("post_categories").select("post_id").eq("category_id", term.id),
      supabase.from("page_categories").select("page_id").eq("category_id", term.id),
    ]);
    if (postRel.error) throw postRel.error;
    if (pageRel.error) throw pageRel.error;

    const [posts, pages] = await Promise.all([
      publishedPosts((postRel.data ?? []).map((r) => r.post_id)),
      publishedPages((pageRel.data ?? []).map((r) => r.page_id)),
    ]);
    return {
      term: { name: term.name, slug: term.slug, description: term.description },
      posts,
      pages,
    };
  },
});

export const tagArchiveQuery = (slug: string) => ({
  queryKey: ["archive", "tag", slug],
  queryFn: async (): Promise<ArchiveResult> => {
    const { data: term, error } = await supabase
      .from("tags")
      .select("id,name,slug")
      .eq("slug", slug)
      .maybeSingle();
    if (error) throw error;
    if (!term) return { term: null, posts: [], pages: [] };

    const [postRel, pageRel] = await Promise.all([
      supabase.from("post_tags").select("post_id").eq("tag_id", term.id),
      supabase.from("page_tags").select("page_id").eq("tag_id", term.id),
    ]);
    if (postRel.error) throw postRel.error;
    if (pageRel.error) throw pageRel.error;

    const [posts, pages] = await Promise.all([
      publishedPosts((postRel.data ?? []).map((r) => r.post_id)),
      publishedPages((pageRel.data ?? []).map((r) => r.page_id)),
    ]);
    return { term: { name: term.name, slug: term.slug, description: null }, posts, pages };
  },
});

/* ── Dernek & yayin bolumleri ──────────────────────────────────────── */

/**
 * Bolum basliklari artik panelden yonetiliyor (Arayuz > Dernek & Yayin bolumleri).
 * Ayar okunamadiginda bu liste devreye girer.
 */
export const defaultLinkGroups: LinkGroup[] = defaultSettings.linkGroups;

export const linksByKindQuery = (kind: string) => ({
  queryKey: ["links", "kind", kind],
  queryFn: async (): Promise<LinkItem[]> => {
    const { data, error } = await supabase
      .from("links")
      .select("*")
      .eq("kind", kind)
      .order("sort_order", { ascending: true });
    if (error) throw error;
    return (data ?? []) as LinkItem[];
  },
});

/* ── Site ici arama ────────────────────────────────────────────────── */

export type SearchHit = {
  kind: "post" | "page" | "event";
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  date: string | null;
};

/** PostgREST `or` filtresinde virgul ve parantez ayirici sayildigi icin temizlenir. */
function escapeSearchTerm(term: string) {
  return term.replace(/[,()%\\]/g, " ").trim();
}

export const SEARCH_LIMIT = 30;

export const searchQuery = (term: string) => ({
  queryKey: ["search", term],
  enabled: term.trim().length >= 2,
  queryFn: async (): Promise<SearchHit[]> => {
    const clean = escapeSearchTerm(term);
    if (clean.length < 2) return [];
    const like = `%${clean}%`;

    const [posts, pages, events] = await Promise.all([
      supabase
        .from("posts")
        .select("id,title,slug,excerpt,published_at,created_at")
        .eq("status", "published")
        .or(`title.ilike.${like},excerpt.ilike.${like},content.ilike.${like}`)
        .order("published_at", { ascending: false, nullsFirst: false })
        .limit(SEARCH_LIMIT),
      supabase
        .from("pages")
        .select("id,title,slug,excerpt")
        .eq("status", "published")
        .or(`title.ilike.${like},excerpt.ilike.${like},content.ilike.${like}`)
        .limit(SEARCH_LIMIT),
      supabase
        .from("events")
        .select("id,title,slug,description,starts_at")
        .eq("status", "published")
        .or(`title.ilike.${like},description.ilike.${like},city.ilike.${like}`)
        .order("starts_at", { ascending: false })
        .limit(SEARCH_LIMIT),
    ]);

    if (posts.error) throw posts.error;
    if (pages.error) throw pages.error;
    if (events.error) throw events.error;

    return [
      ...(posts.data ?? []).map((r) => ({
        kind: "post" as const,
        id: r.id,
        title: r.title,
        slug: r.slug,
        excerpt: r.excerpt,
        date: r.published_at ?? r.created_at,
      })),
      ...(pages.data ?? []).map((r) => ({
        kind: "page" as const,
        id: r.id,
        title: r.title,
        slug: r.slug,
        excerpt: r.excerpt,
        date: null,
      })),
      ...(events.data ?? []).map((r) => ({
        kind: "event" as const,
        id: r.id,
        title: r.title,
        slug: r.slug,
        excerpt: r.description,
        date: r.starts_at,
      })),
    ];
  },
});
