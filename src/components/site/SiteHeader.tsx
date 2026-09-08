import { useState, useEffect } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Menu, Search, X } from "lucide-react";
import { defaultSettings, settingsQuery, menuQuery } from "@/lib/content";

const fallbackNav = [
  { href: "/", label: "Anasayfa" },
  { href: "/haberler", label: "Haberler" },
  { href: "/etkinlikler", label: "Etkinlikler" },
  { href: "/kaynaklar", label: "Dernekler & Yayınlar" },
];

export function SiteHeader() {
  const { data: settings } = useQuery(settingsQuery());
  const { data: menu } = useQuery(menuQuery());
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [term, setTerm] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const s = settings ?? defaultSettings;
  const nav =
    menu && menu.length > 0 ? menu.map((m) => ({ href: m.href, label: m.label })) : fallbackNav;

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = term.trim();
    if (q.length < 2) return;
    setSearchOpen(false);
    setOpen(false);
    void navigate({ to: "/ara", search: { q } });
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/85 backdrop-blur">
      {mounted && s.showAnnouncement && s.announcement ? (
        <div className="surface-hero px-4 py-2 text-center text-xs font-medium text-primary-foreground">
          {s.announcement}
        </div>
      ) : null}
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2.5">
          {s.logoUrl ? (
            <img
              src={s.logoUrl}
              alt={`${s.siteName} logosu`}
              style={{ height: `${s.logoHeight}px` }}
              className="w-auto object-contain"
            />
          ) : null}
          {s.showBrandText ? (
            <span className="leading-tight">
              <span className="block font-display text-base font-semibold">{s.siteName}</span>
              <span className="block text-[11px] text-muted-foreground">{s.tagline}</span>
            </span>
          ) : null}
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
          {s.searchEnabled ? (
            <button
              onClick={() => setSearchOpen((v) => !v)}
              aria-label="Sitede ara"
              aria-expanded={searchOpen}
              className="ml-1 inline-flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground"
            >
              <Search className="size-4.5" />
            </button>
          ) : null}
        </nav>

        <button
          className="inline-flex size-10 items-center justify-center rounded-lg border border-border md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Menüyü aç/kapat"
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {s.searchEnabled && searchOpen ? (
        <div className="border-t border-border bg-background">
          <form onSubmit={submitSearch} className="container-page flex gap-2 py-3">
            <input
              // Arama kutusu acilir acilmaz yazmaya baslanabilsin.
              autoFocus
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="Haber, etkinlik veya sayfa ara…"
              className="h-10 flex-1 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary"
            />
            <button
              type="submit"
              className="h-10 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground"
            >
              Ara
            </button>
          </form>
        </div>
      ) : null}

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
            {s.searchEnabled ? (
              <form onSubmit={submitSearch} className="mt-2 flex gap-2 px-3 pb-2">
                <input
                  value={term}
                  onChange={(e) => setTerm(e.target.value)}
                  placeholder="Sitede ara…"
                  className="h-10 flex-1 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary"
                />
                <button
                  type="submit"
                  className="h-10 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground"
                >
                  Ara
                </button>
              </form>
            ) : null}
          </nav>
        </div>
      ) : null}
    </header>
  );
}
