import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";
import { renderRobots, renderSitemap } from "./lib/sitemap.server";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isH3SwallowedErrorBody(body)) return response;

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isH3SwallowedErrorBody(body: string): boolean {
  try {
    const payload = JSON.parse(body) as { unhandled?: unknown; message?: unknown };
    return payload.unhandled === true && payload.message === "HTTPError";
  } catch {
    return false;
  }
}

// Sitenin asil alan adi aciltip.net. Eski alan adi (aciltipuzmani.com) ve www
// varyantlari ayni Worker'a bagli; arama motorlari cift icerik gormesin diye
// yol ve sorgu korunarak kalici (301) yonlendirilir.
const PRIMARY_HOST = "aciltip.net";
const REDIRECT_HOSTS: Record<string, string> = {
  "www.aciltip.net": PRIMARY_HOST,
  "aciltipuzmani.com": PRIMARY_HOST,
  "www.aciltipuzmani.com": PRIMARY_HOST,
  "admin.aciltipuzmani.com": `admin.${PRIMARY_HOST}`,
};

// Tum yanitlara eklenen temel guvenlik basliklari.
const SECURITY_HEADERS: Record<string, string> = {
  "x-content-type-options": "nosniff",
  "referrer-policy": "strict-origin-when-cross-origin",
  "permissions-policy": "camera=(), microphone=(), geolocation=()",
};

// Yalnizca kendi alan adimizda: Lovable editor onizlemesi siteyi iframe icinde
// actigi icin cerceve yasagi (clickjacking korumasi) orada uygulanmaz.
const PRIMARY_HOST_HEADERS: Record<string, string> = {
  "strict-transport-security": "max-age=31536000",
  "x-frame-options": "SAMEORIGIN",
  "content-security-policy": "frame-ancestors 'self'; object-src 'none'; base-uri 'self'",
};

function isPrimaryHost(hostname: string) {
  return hostname === PRIMARY_HOST || hostname.endsWith(`.${PRIMARY_HOST}`);
}

function withSecurityHeaders(response: Response, hostname: string): Response {
  const secured = new Response(response.body, response);
  const headers = isPrimaryHost(hostname)
    ? { ...SECURITY_HEADERS, ...PRIMARY_HOST_HEADERS }
    : SECURITY_HEADERS;
  for (const [name, value] of Object.entries(headers)) {
    if (!secured.headers.has(name)) secured.headers.set(name, value);
  }
  return secured;
}

async function route(request: Request, url: URL, env: unknown, ctx: unknown) {
  // sitemap.xml ve robots.txt yayindaki icerikten uretilir; public/robots.txt
  // yerine buradaki dinamik surum kullanilir.
  if (url.pathname === "/sitemap.xml") return renderSitemap(url.origin);
  if (url.pathname === "/robots.txt") return renderRobots(url.origin);

  const handler = await getServerEntry();
  const response = await handler.fetch(request, env, ctx);
  return normalizeCatastrophicSsrResponse(response);
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    let hostname = "";
    try {
      const url = new URL(request.url);
      hostname = url.hostname;
      const redirectHost = REDIRECT_HOSTS[url.hostname];
      if (redirectHost) {
        url.protocol = "https:";
        url.hostname = redirectHost;
        url.port = "";
        return Response.redirect(url.toString(), 301);
      }

      return withSecurityHeaders(await route(request, url, env, ctx), hostname);
    } catch (error) {
      console.error(error);
      const page = new Response(renderErrorPage(), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
      return withSecurityHeaders(page, hostname);
    }
  },
};
