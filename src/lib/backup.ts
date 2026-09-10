import { supabase } from "@/integrations/supabase/client";

/**
 * Site yedegi: yazilar ve sayfalar markdown olarak, gorseller images/ klasoru
 * altinda, etkinlik/baglanti kayitlari JSON olarak tek bir zip icinde toplanir.
 * Tamami tarayicida calisir; sunucuya ek yuk binmez.
 */

export type BackupScope = {
  publishedPosts: boolean;
  draftPosts: boolean;
  pages: boolean;
  data: boolean;
  images: boolean;
};

export type BackupProgress = {
  step: string;
  done: number;
  total: number;
};

type Row = {
  slug?: string | null;
  title?: string | null;
  content?: string | null;
  excerpt?: string | null;
  cover_url?: string | null;
  category?: string | null;
  status?: string | null;
  published_at?: string | null;
  created_at?: string | null;
};

const isoDate = (value: unknown) =>
  typeof value === "string" && value.length >= 10 ? value.slice(0, 10) : "tarihsiz";

/** Dosya adinda sorun cikarabilecek karakterleri temizler. */
function safeName(input: string) {
  return (
    input
      .replace(/[\\/:*?"<>|]+/g, "-")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 120) || "adsiz"
  );
}

function frontmatter(fields: Record<string, string | null | undefined>) {
  const lines = Object.entries(fields)
    .filter(([, v]) => v !== null && v !== undefined && v !== "")
    .map(([k, v]) => `${k}: ${JSON.stringify(String(v))}`);
  return `---\n${lines.join("\n")}\n---\n\n`;
}

/** Icerikteki tum gorsel adreslerini toplar. */
export function collectImageUrls(rows: Row[]) {
  const urls = new Set<string>();
  for (const row of rows) {
    const html = row.content ?? "";
    for (const m of html.matchAll(/<img[^>]+src="([^"]+)"/g)) {
      const src = m[1];
      if (src) urls.add(src);
    }
    if (row.cover_url) urls.add(row.cover_url);
  }
  return [...urls];
}

/** Gorsel adresini zip icindeki yola cevirir. */
function imagePath(url: string) {
  try {
    const u = url.startsWith("http") ? new URL(url) : new URL(url, window.location.origin);
    const clean = u.pathname.replace(/^\/+/, "").replace(/^wp-images\//, "");
    const local = u.origin === window.location.origin;
    return `images/${local ? "" : u.hostname + "/"}${clean}`;
  } catch {
    return `images/${safeName(url)}`;
  }
}

export async function buildBackup(
  scope: BackupScope,
  onProgress: (p: BackupProgress) => void,
): Promise<{ blob: Blob; fileName: string; summary: string[] }> {
  const [{ default: JSZip }, { default: TurndownService }] = await Promise.all([
    import("jszip"),
    import("turndown"),
  ]);

  const turndown = new TurndownService({
    headingStyle: "atx",
    codeBlockStyle: "fenced",
    bulletListMarker: "-",
  });
  // Tablolari markdown'a cevirmek yapiyi bozuyor; HTML olarak birakmak daha sadik.
  turndown.keep(["table"]);

  const zip = new JSZip();
  const summary: string[] = [];
  const stamp = new Date().toISOString().slice(0, 10);

  onProgress({ step: "Yazılar okunuyor", done: 0, total: 1 });

  const statuses: string[] = [];
  if (scope.publishedPosts) statuses.push("published");
  if (scope.draftPosts) statuses.push("draft");

  let posts: Row[] = [];
  if (statuses.length) {
    const { data, error } = await supabase
      .from("posts")
      .select("*")
      .in("status", statuses)
      .order("published_at", { ascending: false, nullsFirst: false });
    if (error) throw error;
    posts = (data ?? []) as Row[];
    for (const p of posts) {
      const name = `${safeName(String(p.slug ?? p.title ?? ""))},${isoDate(
        p.published_at ?? p.created_at,
      )}.md`;
      const body =
        frontmatter({
          title: String(p.title ?? ""),
          slug: String(p.slug ?? ""),
          date: isoDate(p.published_at ?? p.created_at),
          category: String(p.category ?? ""),
          status: String(p.status ?? ""),
          cover: p.cover_url ? String(p.cover_url) : "",
          excerpt: p.excerpt ? String(p.excerpt) : "",
        }) + turndown.turndown(String(p.content ?? ""));
      zip.file(`yazilar/${name}`, body);
    }
    summary.push(`${posts.length} yazı`);
  }

  let pages: Row[] = [];
  if (scope.pages) {
    const { data, error } = await supabase.from("pages").select("*").order("sort_order");
    if (error) throw error;
    pages = (data ?? []) as Row[];
    for (const p of pages) {
      const name = `${safeName(String(p.slug ?? p.title ?? ""))},${isoDate(p.created_at)}.md`;
      const body =
        frontmatter({
          title: String(p.title ?? ""),
          slug: String(p.slug ?? ""),
          date: isoDate(p.created_at),
          status: String(p.status ?? ""),
          cover: p.cover_url ? String(p.cover_url) : "",
        }) + turndown.turndown(String(p.content ?? ""));
      zip.file(`sayfalar/${name}`, body);
    }
    summary.push(`${pages.length} sayfa`);
  }

  if (scope.data) {
    const tables = ["events", "links", "external_articles", "menu_items", "site_settings"] as const;
    for (const table of tables) {
      const { data, error } = await supabase.from(table).select("*");
      if (error) throw error;
      zip.file(`veri/${table}.json`, JSON.stringify(data ?? [], null, 2));
    }
    summary.push("etkinlikler, bağlantılar ve ayarlar");
  }

  let okImages = 0;
  const failed: string[] = [];
  if (scope.images) {
    const urls = collectImageUrls([...posts, ...pages]);
    onProgress({ step: "Görseller indiriliyor", done: 0, total: urls.length });
    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      if (!url) continue;
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        zip.file(imagePath(url), await res.blob());
        okImages++;
      } catch {
        failed.push(url);
      }
      onProgress({ step: "Görseller indiriliyor", done: i + 1, total: urls.length });
    }
    summary.push(`${okImages} görsel`);
    if (failed.length) summary.push(`${failed.length} görsel indirilemedi`);
  }

  zip.file(
    "YEDEK-BILGI.txt",
    [
      `aciltip.net — site yedeği`,
      `Tarih: ${new Date().toISOString()}`,
      ``,
      `İçerik: ${summary.join(", ")}`,
      ``,
      `yazilar/   — her yazı ayrı bir markdown dosyası (<slug>,<tarih>.md)`,
      `sayfalar/  — statik sayfalar, aynı biçimde`,
      `images/    — yazılarda geçen tüm görseller, orijinal klasör yapısıyla`,
      `veri/      — etkinlik, bağlantı ve ayar kayıtları (JSON)`,
      ``,
      failed.length ? `İndirilemeyen görseller:\n${failed.join("\n")}` : `Tüm görseller indirildi.`,
    ].join("\n"),
  );

  onProgress({ step: "Arşiv hazırlanıyor", done: 0, total: 1 });
  const blob = await zip.generateAsync({ type: "blob", compression: "DEFLATE" });
  return { blob, fileName: `aciltip-yedek-${stamp}.zip`, summary };
}
