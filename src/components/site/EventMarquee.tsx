import { CalendarDays, MapPin } from "lucide-react";
import type { EventItem } from "@/lib/content";
import { formatDate } from "@/lib/content";
import { Button } from "@/components/ui/button";

type EventMarqueeProps = {
  events: EventItem[];
  speed?: number; // seconds per loop
};

export function EventMarquee({ events, speed = 60 }: EventMarqueeProps) {
  const visible = events.filter((e) => e.status === "published");
  if (visible.length === 0) return null;

  // Duplicate list for seamless infinite loop
  const items = [...visible, ...visible];

  return (
    <div className="group overflow-hidden">
      <div
        className="flex w-max animate-marquee hover:[animation-play-state:paused]"
        style={{ animationDuration: `${speed}s` }}
      >
        {items.map((ev, index) => (
          <div
            key={`${ev.id}-${index}`}
            className="w-48 shrink-0 px-2 sm:w-52 md:w-56"
          >
            <div className="flex h-full flex-col">
              <div className="aspect-[3/4] w-full overflow-hidden rounded-lg bg-secondary">
                {ev.cover_url ? (
                  <img
                    src={ev.cover_url}
                    alt={ev.title}
                    loading="lazy"
                    className="size-full object-cover"
                  />
                ) : (
                  <div className="flex size-full items-center justify-center text-muted-foreground">
                    <CalendarDays className="size-8" />
                  </div>
                )}
              </div>
              <h3 className="mt-3 text-center font-display text-sm font-semibold leading-snug">
                {ev.title}
              </h3>
              <p className="mt-1.5 flex flex-wrap justify-center gap-x-3 text-center text-xs text-muted-foreground">
                <span>{formatDate(ev.starts_at)}</span>
                {ev.city ? (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="size-3.5" /> {ev.city}
                  </span>
                ) : null}
              </p>
              {ev.registration_url ? (
                <Button asChild variant="outline" size="sm" className="mx-auto mt-3">
                  <a href={ev.registration_url} target="_blank" rel="noreferrer">
                    Kayıt
                  </a>
                </Button>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
