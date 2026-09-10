import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouterState } from "@tanstack/react-router";
import { Wrench } from "lucide-react";
import { settingsQuery } from "@/lib/content";
import { useAuth } from "@/hooks/useAuth";

/** Bakim modu acikken siteyi ziyaretcilere kapatir; yonetim paneli acik kalir. */
const ALWAYS_OPEN = ["/admin", "/giris"];

export function MaintenanceGate({ children }: { children: ReactNode }) {
  const { data: settings } = useQuery(settingsQuery());
  const { isStaff, loading } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const on = settings?.maintenanceMode ?? false;
  const exempt = ALWAYS_OPEN.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  if (!on || exempt) {
    return (
      <>
        {on && isStaff ? (
          <div className="bg-destructive px-4 py-2 text-center text-sm font-medium text-destructive-foreground">
            Bakım modu açık — siteyi şu anda yalnızca yöneticiler görebiliyor.
          </div>
        ) : null}
        {children}
      </>
    );
  }

  // Oturum henuz cozulmediyse yoneticiye de bakim ekrani gosterilir, sonra acilir.
  if (!loading && isStaff) {
    return (
      <>
        <div className="bg-destructive px-4 py-2 text-center text-sm font-medium text-destructive-foreground">
          Bakım modu açık — siteyi şu anda yalnızca yöneticiler görebiliyor.
        </div>
        {children}
      </>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <span className="mx-auto mb-6 flex size-14 items-center justify-center rounded-2xl bg-secondary text-secondary-foreground">
          <Wrench className="size-6" />
        </span>
        <h1 className="font-display text-2xl font-semibold md:text-3xl">
          {settings?.maintenanceTitle || "Kısa bir bakımdayız"}
        </h1>
        <p className="mt-3 text-muted-foreground">
          {settings?.maintenanceMessage ||
            "Siteyi daha iyi hale getirmek için kısa bir ara verdik. Kısa süre içinde yeniden buradayız."}
        </p>
        <p className="mt-8 text-xs text-muted-foreground">
          {settings?.siteName || "aciltip.net"}
        </p>
      </div>
    </div>
  );
}
