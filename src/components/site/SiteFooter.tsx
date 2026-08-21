import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { defaultSettings, settingsQuery } from "@/lib/content";

export function SiteFooter() {
  const { data: settings } = useQuery(settingsQuery());

  return (
    <footer className="mt-24 surface-hero text-primary-foreground">
      <div className="container-page grid gap-10 py-14 md:grid-cols-3">
        <div>
          <h3 className="font-display text-lg font-semibold">
            {settings?.siteName ?? "Acil Tıp Uzmanı"}
          </h3>
          <p className="mt-2 max-w-sm text-sm opacity-80">
            {settings?.tagline ?? "Acil Tıp Buluşma Noktası"} — haber, etkinlik ve yayın arşivi.
          </p>
        </div>
        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wide opacity-70">Bölümler</h4>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <Link to="/haberler" className="opacity-85 hover:opacity-100">
                Haberler
              </Link>
            </li>
            <li>
              <Link to="/etkinlikler" className="opacity-85 hover:opacity-100">
                Etkinlikler
              </Link>
            </li>
            <li>
              <Link to="/kaynaklar" className="opacity-85 hover:opacity-100">
                Dernekler & Yayınlar
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wide opacity-70">İletişim</h4>
          <p className="mt-3 text-sm opacity-85">
            {settings?.contactEmail ?? defaultSettings.contactEmail}
          </p>
        </div>
      </div>
      <div className="border-t border-primary-foreground/15 py-5 text-center text-xs opacity-70">
        © {new Date().getFullYear()} {settings?.siteName ?? "Acil Tıp Uzmanı"}. Tüm hakları saklıdır.
      </div>
    </footer>
  );
}
