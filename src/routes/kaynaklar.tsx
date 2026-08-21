import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { linksQuery } from "@/lib/content";
import { LogoWall } from "@/components/site/LogoWall";

export const Route = createFileRoute("/kaynaklar")({
  head: () => ({
    meta: [
      { title: "Dernekler ve Bilimsel Yayınlar — Acil Tıp Uzmanı" },
      {
        name: "description",
        content:
          "Acil tıp dernekleri ve hakemli bilimsel yayınların güncel bağlantı rehberi. Tek sayfada tüm kaynaklar.",
      },
      { property: "og:title", content: "Acil Tıp Dernekleri ve Bilimsel Yayınlar" },
      {
        property: "og:description",
        content: "Acil tıp dernekleri ve dergilerine hızlı erişim rehberi.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(linksQuery()),
  component: ResourcesPage,
});

function ResourcesPage() {
  const { data: links } = useSuspenseQuery(linksQuery());

  return (
    <div className="container-page py-14">
      <h1 className="text-3xl font-semibold md:text-4xl">Dernekler ve yayınlar</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        Acil tıp camiasının dernekleri ve hakemli dergilerine hızlı erişim.
      </p>

      <div className="mt-12">
        <LogoWall links={links} />
      </div>
    </div>
  );
}
