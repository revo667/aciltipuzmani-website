import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { tagArchiveQuery } from "@/lib/content";
import { ArchiveList } from "@/components/site/ArchiveList";

export const Route = createFileRoute("/etiket/$slug")({
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(tagArchiveQuery(params.slug)),
  head: ({ loaderData }) => {
    const name = loaderData?.term?.name;
    if (!name) {
      return {
        meta: [
          { title: "Etiket bulunamadı — Acil Tıp Uzmanı" },
          { name: "robots", content: "noindex" },
        ],
      };
    }
    const description = `${name} etiketiyle işaretlenmiş tüm yazı ve sayfalar.`;
    return {
      meta: [
        { title: `${name} — Acil Tıp Uzmanı` },
        { name: "description", content: description },
        { property: "og:title", content: `${name} — Acil Tıp Uzmanı` },
        { property: "og:description", content: description },
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
  component: TagArchive,
});

function TagArchive() {
  const { slug } = Route.useParams();
  const { data } = useSuspenseQuery(tagArchiveQuery(slug));

  return (
    <ArchiveList
      kind="tag"
      title={data.term?.name ?? "Etiket bulunamadı"}
      description={`Bu etiketle işaretlenmiş tüm içerikler.`}
      found={data.term !== null}
      posts={data.posts}
      pages={data.pages}
    />
  );
}
