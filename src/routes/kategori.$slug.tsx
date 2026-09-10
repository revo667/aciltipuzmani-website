import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { categoryArchiveQuery } from "@/lib/content";
import { ArchiveList } from "@/components/site/ArchiveList";

export const Route = createFileRoute("/kategori/$slug")({
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(categoryArchiveQuery(params.slug)),
  head: ({ loaderData }) => {
    const name = loaderData?.term?.name;
    if (!name) {
      return {
        meta: [
          { title: "Kategori bulunamadı — aciltip.net" },
          { name: "robots", content: "noindex" },
        ],
      };
    }
    const description =
      loaderData?.term?.description ?? `${name} kategorisindeki tüm yazı ve sayfalar.`;
    return {
      meta: [
        { title: `${name} — aciltip.net` },
        { name: "description", content: description.slice(0, 155) },
        { property: "og:title", content: `${name} — aciltip.net` },
        { property: "og:description", content: description.slice(0, 155) },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  errorComponent: () => (
    <div className="container-page py-20 text-center text-muted-foreground">
      İçerik yüklenemedi.
    </div>
  ),
  component: CategoryArchive,
});

function CategoryArchive() {
  const { slug } = Route.useParams();
  const { data } = useSuspenseQuery(categoryArchiveQuery(slug));

  return (
    <ArchiveList
      kind="category"
      title={data.term?.name ?? "Kategori bulunamadı"}
      description={data.term?.description ?? "Bu kategorideki tüm içerikler."}
      found={data.term !== null}
      posts={data.posts}
      pages={data.pages}
    />
  );
}
