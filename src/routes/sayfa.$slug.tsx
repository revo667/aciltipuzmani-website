import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { pageQuery, settingsQuery } from "@/lib/content";
import { RichText } from "@/components/site/RichText";
import { ContentTaxonomy } from "@/components/site/ContentTaxonomy";
import { pageMeta } from "@/lib/seo";

export const Route = createFileRoute("/sayfa/$slug")({
  loader: async ({ context, params }) => {
    const [page, settings] = await Promise.all([
      context.queryClient.ensureQueryData(pageQuery(params.slug)),
      context.queryClient.ensureQueryData(settingsQuery()),
    ]);
    return { page, settings };
  },
  head: ({ loaderData }) => {
    const page = loaderData?.page ?? null;
    if (!page) {
      return pageMeta(loaderData?.settings, { title: "Sayfa bulunamadı", noindex: true });
    }
    return pageMeta(loaderData?.settings, {
      title: page.seo_title || page.title,
      description: page.seo_description || page.excerpt || "",
      image: page.og_image_url || page.cover_url || "",
      type: "article",
      noindex: page.status !== "published",
    });
  },
  errorComponent: () => (
    <div className="container-page py-20 text-center text-muted-foreground">Sayfa yüklenemedi.</div>
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
      <ContentTaxonomy kind="page" id={page.id} className="mt-10 border-t border-border pt-6" />
    </article>
  );
}
