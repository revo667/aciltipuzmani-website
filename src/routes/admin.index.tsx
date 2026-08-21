import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/")({
  component: AdminHome,
});

function useCount(table: "posts" | "events" | "links") {
  return useQuery({
    queryKey: ["count", table],
    queryFn: async () => {
      const { count, error } = await supabase.from(table).select("id", { count: "exact", head: true });
      if (error) throw error;
      return count ?? 0;
    },
  });
}

function AdminHome() {
  const posts = useCount("posts");
  const events = useCount("events");
  const links = useCount("links");

  const cards = [
    { title: "Yazılar", value: posts.data, to: "/admin/yazilar" as const },
    { title: "Etkinlikler", value: events.data, to: "/admin/etkinlikler" as const },
    { title: "Bağlantılar", value: links.data, to: "/admin/baglantilar" as const },
  ];

  return (
    <div>
      <h1 className="text-2xl font-semibold">Yönetim özeti</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Site içeriğini buradan yönetebilirsiniz.
      </p>
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {cards.map((card) => (
          <Link key={card.title} to={card.to}>
            <Card className="card-hover">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {card.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold">{card.value ?? "—"}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
