import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, ExternalLink } from "lucide-react";
import { defaultSettings, settingsQuery, type LinkGroup, type LinkItem } from "@/lib/content";
import { LogoMarquee } from "@/components/site/LogoMarquee";

export function LogoWall({
  links,
  groups,
  showDisclaimer = true,
  marquee = false,
  showAllLink = true,
}: {
  links: LinkItem[];
  /** Verilmezse panelden yonetilen bolum listesi kullanilir. */
  groups?: LinkGroup[];
  showDisclaimer?: boolean;
  marquee?: boolean;
  /** Bolum basliginin sagindaki "Tümü" sekmesi. */
  showAllLink?: boolean;
}) {
  const { data: settings } = useQuery(settingsQuery());
  const activeGroups = groups ?? settings?.linkGroups ?? defaultSettings.linkGroups;

  const visible = activeGroups
    .map((g) => ({ ...g, items: links.filter((l) => l.kind === g.kind) }))
    .filter((g) => g.items.length > 0);

  if (visible.length === 0) return null;

  return (
    <div className="space-y-14">
      {visible.map((group) => (
        <section key={group.kind}>
          <div className="flex items-center gap-4">
            <span className="hidden h-px flex-1 bg-primary/40 sm:block" />
            <h2 className="flex-1 text-center text-xl font-semibold text-primary sm:flex-none md:text-2xl">
              {group.title}
            </h2>
            <span className="hidden h-px flex-1 bg-primary/40 sm:block" />
            {showAllLink ? (
              <Link
                to="/kaynaklar/$kind"
                params={{ kind: group.kind }}
                className="inline-flex shrink-0 items-center gap-1 rounded-full border border-primary/50 px-3 py-1 text-xs font-semibold text-primary transition-colors hover:bg-primary hover:text-primary-foreground md:text-sm"
              >
                Tümü <ArrowRight className="size-3.5" />
              </Link>
            ) : null}
          </div>
          <div className="mt-3 h-0.5 w-full rounded bg-primary/70" />

          {marquee && group.items.length > 4 ? (
            <div className="mt-8">
              <LogoMarquee links={group.items} speed={45} />
            </div>
          ) : (
            <div className="mt-8 grid grid-cols-2 gap-8 md:grid-cols-4">
              {group.items.map((link) => (
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
        </section>
      ))}

      {showDisclaimer && (settings?.showDisclaimer ?? true) ? (
        <p className="border-y-2 border-primary/70 py-6 text-center text-base font-semibold md:text-lg">
          {settings?.disclaimerText ?? defaultSettings.disclaimerText}
        </p>
      ) : null}
    </div>
  );
}
