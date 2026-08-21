import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Menu, X, Activity } from "lucide-react";
import { settingsQuery, menuQuery } from "@/lib/content";

const fallbackNav = [
  { href: "/", label: "Anasayfa" },
  { href: "/haberler", label: "Haberler" },
  { href: "/etkinlikler", label: "Etkinlikler" },
  { href: "/kaynaklar", label: "Dernekler & Yayınlar" },
];

export function SiteHeader() {
  const { data: settings } = useQuery(settingsQuery());
  const { data: menu } = useQuery(menuQuery());
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const nav =
    menu && menu.length > 0
      ? menu.map((m) => ({ href: m.href, label: m.label }))
      : fallbackNav;

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/85 backdrop-blur">
      {mounted && settings?.showAnnouncement && settings.announcement ? (
        <div className="surface-hero px-4 py-2 text-center text-xs font-medium text-primary-foreground">
          {settings.announcement}
        </div>
      ) : null}
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Activity className="size-5" />
          </span>
          <span className="leading-tight">
            <span className="block font-display text-base font-semibold">
              {settings?.siteName ?? "Acil Tıp Uzmanı"}
            </span>
            <span className="block text-[11px] text-muted-foreground">
              {settings?.tagline ?? "Acil Tıp Buluşma Noktası"}
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {nav.map((item) => (
            <a
              key={`${item.href}-${item.label}`}
              href={item.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <button
          className="inline-flex size-10 items-center justify-center rounded-lg border border-border md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Menüyü aç/kapat"
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {open ? (
        <div className="border-t border-border bg-background md:hidden">
          <nav className="container-page flex flex-col py-3">
            {nav.map((item) => (
              <a
                key={`${item.href}-${item.label}`}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                {item.label}
              </a>
            ))}
          </nav>
        </div>
      ) : null}
    </header>
  );
}
