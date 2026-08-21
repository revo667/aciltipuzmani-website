import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate, postsQuery } from "@/lib/content";

export const Route = createFileRoute("/haberler/")({
  head: () => ({
    meta: [
      { title: "Haberler ve Rehberler — Acil Tıp Uzmanı" },
      {
        name: "description",
        content:
          "Acil tıp alanındaki güncel haberler, klinik rehberler ve eğitim içerikleri tek listede.",
      },
      { property: "og:title", content: "Acil Tıp Haberleri ve Rehberleri" },
      {
        property: "og:description",
        content: "Acil tıp camiasından güncel haberler ve klinik rehber içerikleri.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(postsQuery()),
  component: PostsPage,
});

function PostsPage() {
  const { data: posts } = useSuspenseQuery(postsQuery());

  return (
    <div className="container-page py-14">
      <h1 className="text-3xl font-semibold md:text-4xl">Haberler ve rehberler</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        Acil tıp pratiği, eğitim ve camia gündeminden seçilmiş içerikler.
      </p>

      <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {posts.length === 0 ? (
          <p className="text-sm text-muted-foreground">Henüz içerik yayınlanmadı.</p>
        ) : (
          posts.map((post) => (
            <Link key={post.id} to="/haberler/$slug" params={{ slug: post.slug }}>
              <Card className="h-full card-hover">
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
          ))
        )}
      </div>
    </div>
  );
}
