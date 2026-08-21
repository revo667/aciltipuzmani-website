import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ExternalLink, Tag } from "lucide-react";
import { externalArticlesQuery, settingsQuery } from "@/lib/content";

export const Route = createFileRoute("/dis-yazilar")({
  head: () => ({
    meta: [
      { title: "Acil Tıp Web Sitelerinden Yazılar — Acil Tıp Uzmanı" },
      {
        name: "description",
        content:
          "Acil tıp web sitelerinden derlenen güncel yazı ve kaynakların tam listesi.",
      },
      { property: "og:title", content: "Acil Tıp Web Sitelerinden Yazılar" },
      {
        property: "og:description",
        content: "Acil tıp blog ve eğitim sitelerinden seçilmiş yazıların tamamı.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(externalArticlesQuery()),
      context.queryClient.ensureQueryData(settingsQuery()),
    ]);
  },
  errorComponent: () => (
    <div className="container-page py-20 text-center text-muted-foreground">
      İçerik yüklenemedi.
    </div>
  ),
  notFoundComponent: () => (
    <div className="container-page py-20 text-center text-muted-foreground">
      Sayfa bulunamadı.
    </div>
  ),
  component: ExternalArticlesPage,
});

function ExternalArticlesPage() {
  const { data: articles } = useSuspenseQuery(externalArticlesQuery());
  const { data: settings } = useSuspenseQuery(settingsQuery());

  return (
    <div className="container-page py-16">
      <h1 className="text-3xl font-semibold md:text-4xl">{settings.externalTitle}</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        {settings.externalSubtitle ||
          "Acil tıp web sitelerinden derlenen tüm yazılar."}
      </p>
      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {articles.length === 0 ? (
          <p className="text-sm text-muted-foreground">Henüz yazı eklenmemiş.</p>
        ) : (
          articles.map((article) => (
            <a
              key={article.id}
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-card transition-shadow hover:shadow-card-hover"
            >
              <div className="relative aspect-[16/10] overflow-hidden bg-muted">
                {article.cover_url ? (
                  <img
                    src={article.cover_url}
                    alt={article.title}
                    loading="lazy"
                    className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex size-full items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/30">
                    <span className="text-xs font-semibold uppercase tracking-wide text-primary">
                      {article.source_name}
                    </span>
                  </div>
                )}
                <div className="absolute right-2 top-2 rounded-full border border-white/40 bg-black/40 p-1.5 text-white opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100">
                  <ExternalLink className="size-3.5" />
                </div>
              </div>
              <div className="flex flex-1 flex-col p-4">
                <p className="text-xs font-medium text-primary">{article.source_name}</p>
                <h2 className="mt-1 line-clamp-3 text-base font-semibold leading-snug">
                  {article.title}
                </h2>
                {article.tags.length > 0 ? (
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {article.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-1 text-[10px] font-medium text-secondary-foreground"
                      >
                        <Tag className="size-3" />
                        {tag}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            </a>
          ))
        )}
      </div>
    </div>
  );
}
