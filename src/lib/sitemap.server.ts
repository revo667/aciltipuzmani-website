/**
 * sitemap.xml ve robots.txt sunucu tarafinda, yayindaki icerikten uretilir.
 * Yeni yazi eklendiginde ayrica bir sey yapmak gerekmez.
 */

type Row = { slug: string; updated_at?: string | null; published_at?: string | null };

function xmlEscape(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function supabaseRest(path: string) {
  const url = process.env["SUPABASE_URL"] ?? process.env["VITE_SUPABASE_URL"];
  const key =
    process.env["SUPABASE_PUBLISHABLE_KEY"] ?? process.env["VITE_SUPABASE_PUBLISHABLE_KEY"];
  if (!url || !key) return null;
  return fetch(`${url}/rest/v1/${path}`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });
}

async function fetchRows(path: string): Promise<Row[]> {
  try {
    const response = await supabaseRest(path);
    if (!response || !response.ok) return [];
    return (await response.json()) as Row[];
  } catch {
    return [];
  }
}

async function siteIsNoindex(): Promise<boolean> {
  try {
    const response = await supabaseRest("site_settings?key=eq.general&select=value");
    if (!response || !response.ok) return false;
    const rows = (await response.json()) as { value?: { seoNoindex?: boolean } }[];
    return rows[0]?.value?.seoNoindex === true;
  } catch {
    return false;
  }
}

function entry(origin: string, path: string, lastmod?: string | null, priority = "0.6") {
  const date = lastmod ? new Date(lastmod) : null;
  const stamp =
    date && !Number.isNaN(date.getTime())
      ? `\n    <lastmod>${date.toISOString().slice(0, 10)}</lastmod>`
      : "";
  return `  <url>\n    <loc>${xmlEscape(origin + path)}</loc>${stamp}\n    <priority>${priority}</priority>\n  </url>`;
}

export async function renderSitemap(origin: string): Promise<Response> {
  const [posts, pages] = await Promise.all([
    fetchRows(
      "posts?status=eq.published&select=slug,updated_at,published_at&order=published_at.desc&limit=5000",
    ),
    fetchRows("pages?status=eq.published&select=slug,updated_at&limit=1000"),
  ]);

  const staticPaths = ["/", "/haberler", "/etkinlikler", "/kaynaklar", "/dis-yazilar"];
  const body = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...staticPaths.map((path) => entry(origin, path, null, path === "/" ? "1.0" : "0.8")),
    ...posts.map((row) =>
      entry(origin, `/haberler/${row.slug}`, row.updated_at ?? row.published_at, "0.7"),
    ),
    ...pages.map((row) => entry(origin, `/sayfa/${row.slug}`, row.updated_at, "0.5")),
    "</urlset>",
  ].join("\n");

  return new Response(body, {
    headers: {
      "content-type": "application/xml; charset=utf-8",
      "cache-control": "public, max-age=600",
    },
  });
}

export async function renderRobots(origin: string): Promise<Response> {
  const noindex = await siteIsNoindex();
  const body = noindex
    ? ["User-agent: *", "Disallow: /"].join("\n")
    : [
        "User-agent: *",
        "Allow: /",
        "Disallow: /admin",
        "Disallow: /giris",
        "Disallow: /ara",
        "",
        `Sitemap: ${origin}/sitemap.xml`,
      ].join("\n");

  return new Response(`${body}\n`, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=600",
    },
  });
}
