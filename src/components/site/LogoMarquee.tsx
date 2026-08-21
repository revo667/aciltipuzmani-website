import { ExternalLink } from "lucide-react";
import type { LinkItem } from "@/lib/content";

type LogoMarqueeProps = {
  links: LinkItem[];
  title?: string;
  speed?: number; // seconds per loop
};

export function LogoMarquee({ links, title, speed = 40 }: LogoMarqueeProps) {
  const visible = links.filter((l) => l.logo_url || l.url);
  if (visible.length === 0) return null;

  // Duplicate list for seamless infinite loop
  const items = [...visible, ...visible];

  return (
    <div className="group overflow-hidden">
      {title ? (
        <div className="mb-8 flex items-center gap-4">
          <span className="hidden h-px flex-1 bg-primary/40 sm:block" />
          <h2 className="text-center text-xl font-semibold text-primary md:text-2xl">
            {title}
          </h2>
          <span className="hidden h-px flex-1 bg-primary/40 sm:block" />
        </div>
      ) : null}

      <div
        className="flex w-max animate-marquee hover:[animation-play-state:paused]"
        style={{ animationDuration: `${speed}s` }}
      >
        {items.map((link, index) => (
          <a
            key={`${link.id}-${index}`}
            href={link.url}
            target="_blank"
            rel="noreferrer"
            className="mx-3 flex w-44 flex-col items-center gap-3 text-center"
          >
            <span className="flex h-24 w-44 items-center justify-center overflow-hidden rounded-lg bg-white p-3 transition-transform hover:scale-[1.03]">
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
    </div>
  );
}
