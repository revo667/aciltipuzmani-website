import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { LogoWall } from "@/components/site/LogoWall";
import { EventMarquee } from "@/components/site/EventMarquee";
import { ExternalArticlesStrip } from "@/components/site/ExternalArticlesStrip";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  eventsQuery,
  externalArticlesQuery,
  formatDate,
  linksQuery,
  postsQuery,
  settingsQuery,
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
    await Promise.all([
      context.queryClient.ensureQueryData(postsQuery(8)),
      context.queryClient.ensureQueryData(eventsQuery(15)),
      context.queryClient.ensureQueryData(linksQuery()),
      context.queryClient.ensureQueryData(externalArticlesQuery()),
      context.queryClient.ensureQueryData(settingsQuery()),
    ]);
  },
  component: Home,
});

function FeatureTile({
  post,
  className,
  big,
}: {
  post: { slug: string; title: string; cover_url: string | null; published_at: string | null; created_at: string };
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

function Home() {
  const { data: posts } = useSuspenseQuery(postsQuery(8));
  const { data: events } = useSuspenseQuery(eventsQuery(15));
  const { data: links } = useSuspenseQuery(linksQuery());
  const { data: externalArticles } = useSuspenseQuery(externalArticlesQuery());
  const { data: settings } = useSuspenseQuery(settingsQuery());

  const featured = posts.slice(0, 5);
  const placeholders = Math.max(0, 5 - featured.length);

  type FeedItem = {
    key: string;
    kind: string;
    title: string;
    excerpt: string | null;
    date: string;
    to?: { slug: string };
    href?: string;
  };

  const feed: FeedItem[] = [
    ...posts.map((p) => ({
      key: `post-${p.id}`,
      kind: p.category,
      title: p.title,
      excerpt: p.excerpt,
      date: p.published_at ?? p.created_at,
      to: { slug: p.slug },
    })),
    ...events.map((e) => ({
      key: `event-${e.id}`,
      kind: "Etkinlik",
      title: e.title,
      excerpt: e.description,
      date: e.created_at ?? e.starts_at,
    })),
    ...externalArticles.map((a) => ({
      key: `ext-${a.id}`,
      kind: a.source_name,
      title: a.title,
      excerpt: null,
      date: a.created_at,
      href: a.url,
    })),
  ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 6);

  return (
    <div>
      {featured.length > 0 ? (
        <section className="grid gap-px bg-border md:grid-cols-2">
          <FeatureTile
            post={featured[0]!}
            big
            className="min-h-[280px] md:min-h-[520px]"
          />
          <div className="grid gap-px bg-border sm:grid-cols-2">
            {featured.slice(1, 5).map((post) => (
              <FeatureTile key={post.id} post={post} className="min-h-[200px] md:min-h-[260px]" />
            ))}
            {Array.from({ length: placeholders }).map((_, i) => (
              <PlaceholderTile key={`placeholder-${i}`} className="min-h-[200px] md:min-h-[260px]" />
            ))}
          </div>
        </section>
      ) : null}

      <section className="container-page py-16">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold md:text-3xl">{settings.newsTitle}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {settings.newsSubtitle}
            </p>
          </div>
          <Link to="/haberler" className="text-sm font-medium text-primary hover:underline">
            Tümü
          </Link>
        </div>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
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


      <ExternalArticlesStrip
        articles={externalArticles}
        title={settings.externalTitle}
        subtitle={settings.externalSubtitle}
        allUrl={settings.externalAllUrl}
      />

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

      <section className="container-page py-16">
        <div className="text-center">
          <h2 className="text-3xl font-semibold md:text-4xl">{settings.linksTitle}</h2>
          <p className="mx-auto mt-2 max-w-2xl text-muted-foreground">
            {settings.linksSubtitle}
          </p>
        </div>
        <div className="mt-12">
          <LogoWall links={links} marquee />
        </div>
      </section>
    </div>
  );
}
