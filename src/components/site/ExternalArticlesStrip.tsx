import { useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, ChevronLeft, ChevronRight, ExternalLink, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ExternalArticle } from "@/lib/content";

export function ExternalArticlesStrip({
  articles,
  title = "Acil Tıp Web Sitelerinden",
  subtitle,
  allUrl,
}: {
  articles: ExternalArticle[];
  title?: string;
  subtitle?: string;
  allUrl?: string;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const updateButtons = () => {
    const el = trackRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 1);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  };

  const scrollBy = (direction: number) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: direction * el.clientWidth * 0.85, behavior: "smooth" });
    setTimeout(updateButtons, 350);
  };

  if (articles.length === 0) return null;

  const external = allUrl && allUrl.trim().length > 0;

  return (
    <section className="bg-surface py-16">
      <div className="container-page">
        <div className="flex items-end justify-between gap-4">
          <div className="relative">
            <h2 className="text-2xl font-semibold md:text-3xl">{title}</h2>
            {subtitle ? (
              <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
            ) : null}
            <div className="mt-2 h-1 w-24 rounded bg-primary" />
          </div>
          <div className="flex items-center gap-2">
            {external ? (
              <Button asChild variant="outline" className="rounded-full">
                <a href={allUrl} target="_blank" rel="noopener noreferrer">
                  Tümünü Gör <ArrowRight className="ml-1 size-4" />
                </a>
              </Button>
            ) : (
              <Button asChild variant="outline" className="rounded-full">
                <Link to="/dis-yazilar">
                  Tümünü Gör <ArrowRight className="ml-1 size-4" />
                </Link>
              </Button>
            )}

            <Button
              variant="outline"
              size="icon"
              aria-label="Önceki"
              disabled={!canScrollLeft}
              onClick={() => scrollBy(-1)}
              className="rounded-full disabled:opacity-30"
            >
              <ChevronLeft className="size-5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              aria-label="Sonraki"
              disabled={!canScrollRight}
              onClick={() => scrollBy(1)}
              className="rounded-full disabled:opacity-30"
            >
              <ChevronRight className="size-5" />
            </Button>
          </div>
        </div>

        <div
          ref={trackRef}
          onScroll={updateButtons}
          className="scrollbar-hide mt-8 flex snap-x snap-mandatory gap-5 overflow-x-auto pb-4"
        >
          {articles.map((article) => (
            <a
              key={article.id}
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex w-[260px] shrink-0 snap-start flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-card transition-shadow hover:shadow-card-hover md:w-[300px]"
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
                <div className="absolute right-2 top-2 rounded-full border border-white/40 bg-black/40 p-1.5 text-white backdrop-blur-sm opacity-0 transition-opacity group-hover:opacity-100">
                  <ExternalLink className="size-3.5" />
                </div>
              </div>
              <div className="flex flex-1 flex-col p-4">
                <p className="text-xs font-medium text-primary">{article.source_name}</p>
                <h3 className="mt-1 line-clamp-3 text-base font-semibold leading-snug">
                  {article.title}
                </h3>
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
          ))}
        </div>
      </div>
    </section>
  );
}
