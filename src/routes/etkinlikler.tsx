import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { CalendarDays, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { eventsQuery, formatDateTime, type EventItem } from "@/lib/content";

export const Route = createFileRoute("/etkinlikler")({
  head: () => ({
    meta: [
      { title: "Etkinlik ve Kongre Takvimi — Acil Tıp Uzmanı" },
      {
        name: "description",
        content:
          "Acil tıp kongreleri, kursları ve sempozyumlarının güncel takvimi; tarih, şehir ve kayıt bilgileri.",
      },
      { property: "og:title", content: "Acil Tıp Etkinlik ve Kongre Takvimi" },
      {
        property: "og:description",
        content: "Yaklaşan acil tıp kongreleri, kursları ve sempozyumları.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(eventsQuery()),
  component: EventsPage,
});

function EventsPage() {
  const { data: events } = useSuspenseQuery(eventsQuery());
  const now = Date.now();
  const upcoming = events.filter((e) => new Date(e.starts_at).getTime() >= now);
  const past = events.filter((e) => new Date(e.starts_at).getTime() < now).reverse();

  return (
    <div className="container-page py-14">
      <h1 className="text-3xl font-semibold md:text-4xl">Etkinlik takvimi</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        Kongreler, kurslar ve sempozyumlar; tarih ve kayıt bilgileriyle.
      </p>

      <Section title="Yaklaşan" items={upcoming} empty="Yaklaşan etkinlik bulunmuyor." />
      {past.length > 0 ? <Section title="Geçmiş" items={past} empty="" muted /> : null}
    </div>
  );
}

function Section({
  title,
  items,
  empty,
  muted,
}: {
  title: string;
  items: EventItem[];
  empty: string;
  muted?: boolean;
}) {
  return (
    <section className="mt-12">
      <h2 className="text-xl font-semibold">{title}</h2>
      <div className="mt-6 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">{empty}</p>
        ) : (
          items.map((ev) => (
            <div key={ev.id} className={`flex flex-col ${muted ? "opacity-70" : ""}`}>
              <div className="aspect-[3/4] w-full overflow-hidden rounded-lg border border-border bg-secondary">
                {ev.cover_url ? (
                  <img
                    src={ev.cover_url}
                    alt={ev.title}
                    loading="lazy"
                    className="size-full object-cover"
                  />
                ) : (
                  <div className="flex size-full items-center justify-center text-muted-foreground">
                    <CalendarDays className="size-10" />
                  </div>
                )}
              </div>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                <h3 className="text-center font-display text-base font-semibold leading-snug">
                  {ev.title}
                </h3>
                {ev.featured ? <Badge>Öne çıkan</Badge> : null}
              </div>
              <p className="mt-1.5 flex flex-wrap justify-center gap-x-3 text-center text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <CalendarDays className="size-3.5" /> {formatDateTime(ev.starts_at)}
                </span>
                {ev.location || ev.city ? (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="size-3.5" />
                    {[ev.location, ev.city].filter(Boolean).join(", ")}
                  </span>
                ) : null}
              </p>
              {ev.registration_url ? (
                <Button asChild variant="outline" size="sm" className="mx-auto mt-3">
                  <a href={ev.registration_url} target="_blank" rel="noreferrer">
                    Kayıt ol
                  </a>
                </Button>
              ) : null}
            </div>
          ))
        )}
      </div>
    </section>
  );
}
