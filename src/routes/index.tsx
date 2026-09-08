import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { LogoWall } from "@/components/site/LogoWall";
import { EventMarquee } from "@/components/site/EventMarquee";
import { ExternalArticlesStrip } from "@/components/site/ExternalArticlesStrip";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  categorySlugsOf,
  eventsQuery,
  externalArticlesQuery,
  formatDate,
  homeTaxonomyQuery,
  HOME_POST_POOL,
  linksQuery,
  postCardsQuery,
  settingsQuery,
  type HomeTaxonomy,
  type PostCard,
} from "@/lib/content";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Acil Tıp Uzmanı — Acil Tıp Haber ve Etkinlik Merkezi" },
      {
        name: "description",
        content:
          "Türkiye acil tıp camiası için güncel haberler, kongre ve kurs takvimi, dernek ve bilimsel yayın bağlantıları.",
      },
      { property: "og:title", content: "Acil Tıp Uzmanı — Acil Tıp Buluşma Noktası" },
      {
        property: "og:description",
        content: "Acil tıp haberleri, kongre takvimi ve bilimsel yayın kaynakları tek adreste.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: async ({ context }) => {
    // Etkinlik sayisi ayara bagli oldugu icin once ayarlar cekilir.
    const settings = await context.queryClient.ensureQueryData(settingsQuery());
    await Promise.all([
      context.queryClient.ensureQueryData(postCardsQuery(HOME_POST_POOL)),
      context.queryClient.ensureQueryData(eventsQuery(settings.homeEventsLimit)),
      context.queryClient.ensureQueryData(linksQuery()),
      context.queryClient.ensureQueryData(externalArticlesQuery()),
      context.queryClient.ensureQueryData(homeTaxonomyQuery()),
    ]);
  },
  component: Home,
});

/** Tailwind siniflari derleme aninda taranir; sutun sayisi bu tablodan secilir. */
const feedGridClass: Record<number, string> = {
  2: "md:grid-cols-2",
  3: "md:grid-cols-3",
  4: "md:grid-cols-4",
};

/** Kategorisi olmayan ogeler (etkinlik, dis yazi) kategori siralamasinda en sona duser. */
const UNRANKED = Number.MAX_SAFE_INTEGER;

function FeatureTile({
  post,
  className,
  big,
}: {
  post: {
    slug: string;
    title: string;
    cover_url: string | null;
    published_at: string | null;
    created_at: string;
  };
  className?: string;
  big?: boolean;
}) {
  return (
    <Link
      to="/haberler/$slug"
      params={{ slug: post.slug }}
      className={`group relative overflow-hidden ${className ?? ""}`}
    >
      {post.cover_url ? (
        <img
          src={post.cover_url}
          alt={post.title}
          loading="lazy"
          className="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-primary/80 via-primary/40 to-secondary" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-foreground/85 via-foreground/25 to-transparent" />
      <div className="relative flex h-full flex-col justify-end p-5 md:p-6">
        <h3
          className={`font-display font-semibold uppercase leading-tight tracking-tight text-background ${
            big ? "text-xl md:text-3xl" : "text-base md:text-lg"
          }`}
        >
          {post.title}
        </h3>
        <p className="mt-2 text-xs text-background/80 md:text-sm">
          {formatDate(post.published_at ?? post.created_at)}
        </p>
      </div>
    </Link>
  );
}

function PlaceholderTile({ className }: { className?: string }) {
  return (
    <Link
      to="/haberler"
      className={`group relative overflow-hidden bg-gradient-to-br from-primary/30 via-primary/10 to-secondary/30 ${className ?? ""}`}
    >
      <div className="absolute inset-0 bg-gradient-to-t from-foreground/40 via-transparent to-transparent" />
      <div className="relative flex h-full flex-col items-center justify-center p-5 md:p-6 text-center">
        <span className="inline-flex items-center justify-center rounded-full border border-background/40 bg-background/10 px-4 py-2 text-sm font-medium text-foreground/80 backdrop-blur-sm transition-colors group-hover:bg-background/20">
          Tüm haberler
        </span>
      </div>
    </Link>
  );
}

/** Secili kategori yoksa filtre uygulanmaz; varsa yazinin kategorilerinden biri eslesmelidir. */
function matchesCategories(post: PostCard, taxonomy: HomeTaxonomy, selected: string[]) {
  if (selected.length === 0) return true;
  return categorySlugsOf(post, taxonomy).some((slug) => selected.includes(slug));
}

function Home() {
  const { data: settings } = useSuspenseQuery(settingsQuery());
  const { data: posts } = useSuspenseQuery(postCardsQuery(HOME_POST_POOL));
  const { data: events } = useSuspenseQuery(eventsQuery(settings.homeEventsLimit));
  const { data: links } = useSuspenseQuery(linksQuery());
  const { data: externalArticles } = useSuspenseQuery(externalArticlesQuery());
  const { data: taxonomy } = useSuspenseQuery(homeTaxonomyQuery());

  /* ── Vitrin ─────────────────────────────────────────────────────── */
  const featured = settings.homeFeaturedEnabled
    ? posts
        .filter((p) => matchesCategories(p, taxonomy, settings.homeFeaturedCategories))
        .slice(0, settings.homeFeaturedCount)
    : [];
  // Sag sutun her zaman en az bir kutu gosterir; eksik kalanlar "Tüm haberler" karosuyla dolar.
  const sideSlots = Math.max(1, settings.homeFeaturedCount - 1);
  const placeholders = Math.max(0, sideSlots - Math.max(0, featured.length - 1));
  const featuredIds = new Set(featured.map((p) => p.id));

  /* ── Son yazilar ────────────────────────────────────────────────── */
  type FeedItem = {
    key: string;
    kind: string;
    rank: number;
    title: string;
    excerpt: string | null;
    date: string;
    to?: { slug: string };
    href?: string;
  };

  const rankOf = (slugs: string[]) =>
    slugs.reduce(
      (best, slug) => Math.min(best, taxonomy.terms[slug]?.sortOrder ?? UNRANKED),
      UNRANKED,
    );

  const feedPosts: FeedItem[] = posts
    .filter((p) => !featuredIds.has(p.id))
    .filter((p) => matchesCategories(p, taxonomy, settings.homeFeedCategories))
    .map((p) => {
      const slugs = categorySlugsOf(p, taxonomy);
      const primary = slugs[0];
      return {
        key: `post-${p.id}`,
        kind: (primary ? taxonomy.terms[primary]?.name : undefined) ?? p.category,
        rank: rankOf(slugs),
        title: p.title,
        excerpt: p.excerpt,
        date: p.published_at ?? p.created_at,
        to: { slug: p.slug },
      };
    });

  const feedEvents: FeedItem[] = settings.homeFeedIncludeEvents
    ? events.map((e) => ({
        key: `event-${e.id}`,
        kind: "Etkinlik",
        rank: UNRANKED,
        title: e.title,
        excerpt: e.description,
        date: e.created_at ?? e.starts_at,
      }))
    : [];

  const feedExternal: FeedItem[] = settings.homeFeedIncludeExternal
    ? externalArticles.map((a) => ({
        key: `ext-${a.id}`,
        kind: a.source_name,
        rank: UNRANKED,
        title: a.title,
        excerpt: null,
        date: a.created_at,
        href: a.url,
      }))
    : [];

  const byDate = (a: FeedItem, b: FeedItem) =>
    new Date(b.date).getTime() - new Date(a.date).getTime();
  const feed = [...feedPosts, ...feedEvents, ...feedExternal]
    .sort(
      settings.homeFeedOrder === "category" ? (a, b) => a.rank - b.rank || byDate(a, b) : byDate,
    )
    .slice(0, settings.homeFeedColumns * settings.homeFeedRows);

  return (
    <div>
      {featured.length > 0 ? (
        <section className="grid gap-px bg-border md:grid-cols-2">
          <FeatureTile post={featured[0]!} big className="min-h-[280px] md:min-h-[520px]" />
          <div className="grid gap-px bg-border">
            {featured.slice(1).map((post) => (
              <FeatureTile key={post.id} post={post} className="min-h-[200px] md:min-h-[260px]" />
            ))}
            {Array.from({ length: placeholders }).map((_, i) => (
              <PlaceholderTile
                key={`placeholder-${i}`}
                className="min-h-[200px] md:min-h-[260px]"
              />
            ))}
          </div>
        </section>
      ) : null}

      {settings.homeFeedEnabled ? (
        <section className="container-page py-16">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold md:text-3xl">{settings.newsTitle}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{settings.newsSubtitle}</p>
            </div>
            <Link to="/haberler" className="text-sm font-medium text-primary hover:underline">
              Tümü
            </Link>
          </div>
          <div
            className={`mt-8 grid gap-6 ${feedGridClass[settings.homeFeedColumns] ?? "md:grid-cols-3"}`}
          >
            {feed.length === 0 ? (
              <p className="text-sm text-muted-foreground">Henüz yayınlanmış içerik yok.</p>
            ) : (
              feed.map((item) => {
                const card = (
                  <Card className="h-full card-hover">
                    <CardHeader>
                      <Badge variant="secondary" className="w-fit capitalize">
                        {item.kind}
                      </Badge>
                      <CardTitle className="mt-2 text-lg leading-snug">{item.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {item.excerpt ? (
                        <p className="line-clamp-3 text-sm text-muted-foreground">{item.excerpt}</p>
                      ) : null}
                      <p className="mt-4 text-xs text-muted-foreground">{formatDate(item.date)}</p>
                    </CardContent>
                  </Card>
                );
                if (item.to) {
                  return (
                    <Link key={item.key} to="/haberler/$slug" params={{ slug: item.to.slug }}>
                      {card}
                    </Link>
                  );
                }
                if (item.href) {
                  return (
                    <a key={item.key} href={item.href} target="_blank" rel="noopener noreferrer">
                      {card}
                    </a>
                  );
                }
                return (
                  <Link key={item.key} to="/etkinlikler">
                    {card}
                  </Link>
                );
              })
            )}
          </div>
        </section>
      ) : null}

      {settings.homeExternalEnabled ? (
        <ExternalArticlesStrip
          articles={externalArticles}
          title={settings.externalTitle}
          subtitle={settings.externalSubtitle}
          allUrl={settings.externalAllUrl}
        />
      ) : null}

      {settings.homeEventsEnabled ? (
        <section className="bg-surface py-16">
          <div className="container-page">
            <div className="flex items-end justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold md:text-3xl">{settings.eventsTitle}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{settings.eventsSubtitle}</p>
              </div>
              <Link to="/etkinlikler" className="text-sm font-medium text-primary hover:underline">
                Takvim
              </Link>
            </div>
            <div className="mt-8">
              <EventMarquee events={events} speed={60} />
            </div>
          </div>
        </section>
      ) : null}

      {settings.homeLinksEnabled ? (
        <section className="container-page py-16">
          <div className="text-center">
            <h2 className="text-3xl font-semibold md:text-4xl">{settings.linksTitle}</h2>
            <p className="mx-auto mt-2 max-w-2xl text-muted-foreground">{settings.linksSubtitle}</p>
          </div>
          <div className="mt-12">
            <LogoWall links={links} marquee />
          </div>
        </section>
      ) : null}
    </div>
  );
}
