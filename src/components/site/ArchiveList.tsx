import { Link } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate, type PageItem, type Post } from "@/lib/content";

/** Kategori ve etiket arsiv sayfalarinin ortak listesi. */
export function ArchiveList({
  kind,
  title,
  description,
  found,
  posts,
  pages,
}: {
  kind: "category" | "tag";
  title: string;
  description: string;
  found: boolean;
  posts: Post[];
  pages: PageItem[];
}) {
  if (!found) {
    return (
      <div className="container-page py-24 text-center">
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Aradığınız {kind === "category" ? "kategori" : "etiket"} bulunamadı.
        </p>
        <Link to="/haberler" className="mt-6 inline-block text-sm text-primary hover:underline">
          Haberlere dön
        </Link>
      </div>
    );
  }

  const empty = posts.length === 0 && pages.length === 0;

  return (
    <div className="container-page py-14">
      <p className="text-sm font-medium uppercase tracking-wide text-primary">
        {kind === "category" ? "Kategori" : "Etiket"}
      </p>
      <h1 className="mt-2 text-3xl font-semibold md:text-4xl">{title}</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">{description}</p>

      {empty ? (
        <p className="mt-10 text-sm text-muted-foreground">
          Bu başlık altında henüz yayınlanmış içerik yok.
        </p>
      ) : null}

      {posts.length > 0 ? (
        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <Link key={post.id} to="/haberler/$slug" params={{ slug: post.slug }} className="group">
              <Card className="h-full overflow-hidden card-hover">
                <div className="aspect-[16/9] w-full overflow-hidden border-b border-border">
                  {post.cover_url ? (
                    <img
                      src={post.cover_url}
                      alt=""
                      loading="lazy"
                      className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="size-full bg-gradient-to-br from-primary/70 via-primary/35 to-secondary" />
                  )}
                </div>
                <CardHeader>
                  <Badge variant="secondary" className="w-fit capitalize">
                    {post.category}
                  </Badge>
                  <CardTitle className="mt-2 text-lg leading-snug">{post.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="line-clamp-3 text-sm text-muted-foreground">{post.excerpt}</p>
                  <p className="mt-4 text-xs text-muted-foreground">
                    {formatDate(post.published_at ?? post.created_at)}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : null}

      {pages.length > 0 ? (
        <section className="mt-14">
          <h2 className="text-xl font-semibold">Sayfalar</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {pages.map((page) => (
              <Link
                key={page.id}
                to="/sayfa/$slug"
                params={{ slug: page.slug }}
                className="rounded-xl border border-border bg-card p-4 shadow-card transition-shadow hover:shadow-card-hover"
              >
                <h3 className="font-medium leading-snug">{page.title}</h3>
                {page.excerpt ? (
                  <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{page.excerpt}</p>
                ) : null}
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
