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
};

export const defaultSettings: GeneralSettings = {
  siteName: "Acil Tıp Uzmanı",
  tagline: "Acil Tıp Merkezi",
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

export function formatDateTime(value: string | null) {
  if (!value) return "";
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Europe/Istanbul",
  }).format(new Date(value));
}

