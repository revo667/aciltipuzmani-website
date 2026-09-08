import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { defaultSettings, linksQuery, settingsQuery } from "@/lib/content";
import { LogoWall } from "@/components/site/LogoWall";
import { pageMeta } from "@/lib/seo";

export const Route = createFileRoute("/kaynaklar/")({
  loader: async ({ context }) => {
    const [, settings] = await Promise.all([
      context.queryClient.ensureQueryData(linksQuery()),
      context.queryClient.ensureQueryData(settingsQuery()),
    ]);
    return { settings };
  },
  head: ({ loaderData }) =>
    pageMeta(loaderData?.settings, {
      title: loaderData?.settings.linksTitle ?? defaultSettings.linksTitle,
      description: loaderData?.settings.linksSubtitle ?? defaultSettings.linksSubtitle,
    }),
  component: ResourcesPage,
});

function ResourcesPage() {
  const { data: links } = useSuspenseQuery(linksQuery());
  const { data: settings } = useQuery(settingsQuery());

  return (
    <div className="container-page py-14">
      <h1 className="text-3xl font-semibold md:text-4xl">
        {settings?.linksTitle ?? defaultSettings.linksTitle}
      </h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        {settings?.linksSubtitle ?? defaultSettings.linksSubtitle}
      </p>

      <div className="mt-12">
        <LogoWall links={links} />
      </div>
    </div>
  );
}
