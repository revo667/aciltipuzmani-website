import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { pageQuery } from "@/lib/content";
import { RichText } from "@/components/site/RichText";

export const Route = createFileRoute("/sayfa/$slug")({
  loader: ({ context, params }) => context.queryClient.ensureQueryData(pageQuery(params.slug)),
  head: ({ loaderData }) => {
    const page = loaderData ?? null;
    if (!page) {
      return {
        meta: [
          { title: "Sayfa bulunamadı — Acil Tıp Uzmanı" },
          { name: "robots", content: "noindex" },
        ],
      };
    }
    const description = page.excerpt ?? `${page.title} — Acil Tıp Uzmanı`;
    return {
      meta: [
        { title: `${page.title} — Acil Tıp Uzmanı` },
        { name: "description", content: description.slice(0, 155) },
        { property: "og:title", content: page.title },
        { property: "og:description", content: description.slice(0, 155) },
        { property: "og:type", content: "article" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  errorComponent: () => (
    <div className="container-page py-20 text-center text-muted-foreground">
      Sayfa yüklenemedi.
    </div>
  ),
  notFoundComponent: () => (
    <div className="container-page py-20 text-center text-muted-foreground">Sayfa bulunamadı.</div>
  ),
  component: PageView,
});

function PageView() {
  const { slug } = Route.useParams();
  const { data: page } = useSuspenseQuery(pageQuery(slug));

  if (!page || page.status !== "published") {
    return (
      <div className="container-page py-20 text-center">
        <h1 className="text-2xl font-semibold">Sayfa bulunamadı</h1>
        <Link to="/" className="mt-4 inline-block text-sm text-primary underline">
          Anasayfaya dön
        </Link>
      </div>
    );
  }

  return (
    <article className="container-page max-w-3xl py-14">
      <h1 className="font-display text-3xl font-semibold md:text-4xl">{page.title}</h1>
      {page.excerpt ? <p className="mt-3 text-lg text-muted-foreground">{page.excerpt}</p> : null}
      {page.cover_url ? (
        <img
          src={page.cover_url}
          alt={page.title}
          className="mt-8 w-full rounded-2xl border border-border object-cover"
        />
      ) : null}
      <RichText html={page.content} className="mt-8" />
    </article>
  );
}
