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
};

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
};

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

export const settingsQuery = () => ({
  queryKey: ["site_settings", "general"],
  queryFn: async (): Promise<GeneralSettings> => {
    const { data, error } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "general")
      .maybeSingle();
    if (error) throw error;
    return { ...defaultSettings, ...((data?.value as Partial<GeneralSettings>) ?? {}) };
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

export type LinkGroup = { kind: string; title: string };

/** LogoWall bolumleri ve /kaynaklar/$kind sayfalari ayni listeyi kullanir. */
export const linkGroups: LinkGroup[] = [
  { kind: "yayin", title: "Acil Tıp Derneklerinin Yayınları" },
  { kind: "dernek", title: "Acil Tıp Dernekleri" },
  { kind: "klinik", title: "Acil Tıp Klinikleri Web Siteleri" },
  { kind: "kaynak", title: "Acil Tıp Web Siteleri" },
];

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
