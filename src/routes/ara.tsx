import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, FileText, Newspaper, Search } from "lucide-react";
import { defaultSettings, formatDate, searchQuery, settingsQuery } from "@/lib/content";
import { pageMeta } from "@/lib/seo";

export const Route = createFileRoute("/ara")({
  validateSearch: (search: Record<string, unknown>) => ({
    q: typeof search["q"] === "string" ? search["q"] : "",
  }),
  loader: async ({ context }) => ({
    settings: await context.queryClient.ensureQueryData(settingsQuery()),
  }),
  head: ({ loaderData }) =>
    pageMeta(loaderData?.settings, {
      title: "Arama",
      description: "Site içinde haber, etkinlik ve sayfa araması.",
      // Arama sonuclari arama motorlarinda indekslenmemeli.
      noindex: true,
    }),
  component: SearchPage,
});

const kindMeta = {
  post: { label: "Haber", icon: Newspaper },
  page: { label: "Sayfa", icon: FileText },
  event: { label: "Etkinlik", icon: CalendarDays },
} as const;

function hrefFor(kind: "post" | "page" | "event", slug: string) {
  if (kind === "post") return `/haberler/${slug}`;
  if (kind === "page") return `/sayfa/${slug}`;
  return "/etkinlikler";
}

function SearchPage() {
  const { q } = Route.useSearch();
  const navigate = useNavigate();
  const [term, setTerm] = useState(q);
  const { data: settings } = useQuery(settingsQuery());

  useEffect(() => {
    setTerm(q);
  }, [q]);

  const { data: hits = [], isFetching } = useQuery(searchQuery(q));
  const s = settings ?? defaultSettings;

  return (
    <div className="container-page max-w-3xl py-14">
      <h1 className="font-display text-3xl font-semibold md:text-4xl">Arama</h1>

      <form
        className="mt-6 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void navigate({ to: "/ara", search: { q: term.trim() } });
        }}
      >
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Haber, etkinlik veya sayfa ara…"
            className="h-11 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm outline-none focus:border-primary"
          />
        </div>
        <button
          type="submit"
          className="h-11 rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground"
        >
          Ara
        </button>
      </form>

      {!s.searchEnabled ? (
        <p className="mt-10 text-sm text-muted-foreground">Arama şu anda kapalı.</p>
      ) : q.trim().length < 2 ? (
        <p className="mt-10 text-sm text-muted-foreground">Aramak için en az iki harf yazın.</p>
      ) : isFetching ? (
        <p className="mt-10 text-sm text-muted-foreground">Aranıyor…</p>
      ) : hits.length === 0 ? (
        <div className="mt-10 rounded-xl border border-dashed border-border p-10 text-center">
          <p className="text-sm text-muted-foreground">
            "<span className="font-medium text-foreground">{q}</span>" için sonuç bulunamadı.
          </p>
          <Link to="/haberler" className="mt-4 inline-block text-sm text-primary hover:underline">
            Tüm haberlere göz atın
          </Link>
        </div>
      ) : (
        <>
          <p className="mt-6 text-sm text-muted-foreground">{hits.length} sonuç bulundu.</p>
          <div className="mt-6 space-y-3">
            {hits.map((hit) => {
              const meta = kindMeta[hit.kind];
              const Icon = meta.icon;
              return (
                <a
                  key={`${hit.kind}-${hit.id}`}
                  href={hrefFor(hit.kind, hit.slug)}
                  className="card-hover flex gap-4 rounded-xl border border-border bg-card p-4 shadow-card"
                >
                  <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
                    <Icon className="size-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{hit.title}</span>
                      <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] text-secondary-foreground">
                        {meta.label}
                      </span>
                    </span>
                    {hit.excerpt ? (
                      <span className="mt-1 line-clamp-2 block text-sm text-muted-foreground">
                        {hit.excerpt}
                      </span>
                    ) : null}
                    {hit.date ? (
                      <span className="mt-1 block text-xs text-muted-foreground">
                        {formatDate(hit.date)}
                      </span>
                    ) : null}
                  </span>
                </a>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
