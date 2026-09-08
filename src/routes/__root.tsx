import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { Toaster } from "@/components/ui/sonner";
import { MaintenanceGate } from "@/components/site/MaintenanceGate";
import { fontHref, themeCss } from "@/components/site/ThemeStyle";
import { defaultSettings, settingsQuery } from "@/lib/content";
import { pageMeta } from "@/lib/seo";
import { reportLovableError } from "../lib/lovable-error-reporting";

function NotFoundComponent() {
  const { data: settings } = useQuery(settingsQuery());
  const s = settings ?? defaultSettings;

  return (
    <div className="flex min-h-[60vh] items-center justify-center bg-background px-4 py-20">
      <div className="max-w-md text-center">
        <h1 className="font-display text-7xl font-bold text-primary">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">{s.notFoundTitle}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{s.notFoundMessage}</p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {s.notFoundButton}
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  const { data: settings } = useQuery(settingsQuery());
  const s = settings ?? defaultSettings;

  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center bg-background px-4 py-20">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">{s.errorTitle}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{s.errorMessage}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Tekrar dene
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Anasayfaya dön
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  // Baslik, favicon, renkler ve analitik kodu panelden geldigi icin
  // ayarlar sunucu tarafinda da yuklenir.
  loader: async ({ context }) => {
    try {
      return { settings: await context.queryClient.ensureQueryData(settingsQuery()) };
    } catch {
      return { settings: defaultSettings };
    }
  },
  head: ({ loaderData }) => {
    const settings = loaderData?.settings ?? defaultSettings;
    const base = pageMeta(settings);

    const meta = [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      ...base.meta,
    ];
    if (settings.searchConsoleToken) {
      meta.push({ name: "google-site-verification", content: settings.searchConsoleToken });
    }

    return {
      meta,
      links: [
        { rel: "stylesheet", href: appCss },
        { rel: "icon", href: settings.faviconUrl || defaultSettings.faviconUrl },
        { rel: "preconnect", href: "https://fonts.googleapis.com" },
        { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
        { rel: "stylesheet", href: fontHref(settings) },
      ],
      styles: [{ children: themeCss(settings) }],
      scripts: settings.gaMeasurementId
        ? [
            {
              src: `https://www.googletagmanager.com/gtag/js?id=${settings.gaMeasurementId}`,
              async: true,
            },
            {
              children: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${settings.gaMeasurementId}');`,
            },
          ]
        : [],
    };
  },
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="tr">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  // admin.<domain> alt alan adı doğrudan yönetim paneline gider.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const host = window.location.hostname;
    const path = window.location.pathname;
    if (host.startsWith("admin.") && !path.startsWith("/admin") && !path.startsWith("/giris")) {
      window.location.replace("/admin");
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      <MaintenanceGate>
        <div className="flex min-h-screen flex-col">
          <SiteHeader />
          <main className="flex-1">
            <Outlet />
          </main>
          <SiteFooter />
        </div>
      </MaintenanceGate>
      <Toaster position="top-center" richColors />
    </QueryClientProvider>
  );
}
