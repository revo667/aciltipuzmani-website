import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { defaultLinkGroups, linksByKindQuery, settingsQuery, type LinkGroup } from "@/lib/content";

export const Route = createFileRoute("/kaynaklar/$kind")({
  loader: async ({ context, params }) => {
    const [, settings] = await Promise.all([
      context.queryClient.ensureQueryData(linksByKindQuery(params.kind)),
      context.queryClient.ensureQueryData(settingsQuery()),
    ]);
    return { groups: settings.linkGroups as LinkGroup[] };
  },
  head: ({ params, loaderData }) => {
    const groups = loaderData?.groups ?? defaultLinkGroups;
    const group = groups.find((g) => g.kind === params.kind);
    if (!group) {
      return {
        meta: [
          { title: "Bölüm bulunamadı — aciltip.net" },
          { name: "robots", content: "noindex" },
        ],
      };
    }
    const description = `${group.title} listesinin tamamı. Acil tıp camiasının bağlantı rehberi.`;
    return {
      meta: [
        { title: `${group.title} — aciltip.net` },
        { name: "description", content: description },
        { property: "og:title", content: group.title },
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
  component: LinkGroupPage,
});

function LinkGroupPage() {
  const { kind } = Route.useParams();
  const { data: links } = useSuspenseQuery(linksByKindQuery(kind));
  const { data: settings } = useQuery(settingsQuery());
  const group = (settings?.linkGroups ?? defaultLinkGroups).find((g) => g.kind === kind);

  return (
    <div className="container-page py-14">
      <Link
        to="/kaynaklar"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Dernekler ve yayınlar
      </Link>

      <h1 className="mt-6 text-3xl font-semibold md:text-4xl">{group?.title ?? "Bağlantılar"}</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        Bu başlık altındaki bağlantıların tamamı.
      </p>
      <div className="mt-4 h-0.5 w-full rounded bg-primary/70" />

      {links.length === 0 ? (
        <p className="mt-10 text-sm text-muted-foreground">Bu bölümde henüz bağlantı eklenmemiş.</p>
      ) : (
        <div className="mt-10 grid grid-cols-2 gap-8 md:grid-cols-4">
          {links.map((link) => (
            <a
              key={link.id}
              href={link.url}
              target="_blank"
              rel="noreferrer"
              className="group flex flex-col items-center gap-3 text-center"
            >
              <span className="flex h-24 w-full items-center justify-center overflow-hidden rounded-lg bg-white p-2 transition-transform group-hover:scale-[1.03]">
                {link.logo_url ? (
                  <img
                    src={link.logo_url}
                    alt={`${link.name} logosu`}
                    loading="lazy"
                    className="max-h-full max-w-full object-contain"
                  />
                ) : (
                  <ExternalLink className="size-6 text-muted-foreground" />
                )}
              </span>
              <span className="text-sm font-medium leading-snug">{link.name}</span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
