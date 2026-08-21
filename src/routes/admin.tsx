import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import {
  FileText,
  CalendarDays,
  Users,
  Palette,
  LinkIcon,
  LayoutDashboard,
  Files,
  ListTree,
  Globe,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Yönetim Paneli — Acil Tıp Uzmanı" },
      { name: "description", content: "İçerik, etkinlik, kullanıcı ve arayüz yönetimi paneli." },
      { property: "og:title", content: "Yönetim Paneli — Acil Tıp Uzmanı" },
      { property: "og:description", content: "İçerik ve site yönetimi." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminLayout,
});

const items = [
  { to: "/admin", label: "Özet", icon: LayoutDashboard, exact: true },
  { to: "/admin/yazilar", label: "Yazılar", icon: FileText },
  { to: "/admin/etkinlikler", label: "Etkinlikler", icon: CalendarDays },
  { to: "/admin/baglantilar", label: "Dernek & Yayın", icon: LinkIcon },
  { to: "/admin/dislinkler", label: "Dış Linkler", icon: Globe },
  { to: "/admin/sayfalar", label: "Sayfalar", icon: Files },
  { to: "/admin/menu", label: "Menü", icon: ListTree },
  { to: "/admin/arayuz", label: "Arayüz", icon: Palette },
  { to: "/admin/kullanicilar", label: "Kullanıcılar", icon: Users },
] as const;

function AdminLayout() {
  const { loading, user, isStaff } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) void navigate({ to: "/giris" });
  }, [loading, user, navigate]);

  if (loading) {
    return <div className="container-page py-24 text-sm text-muted-foreground">Yükleniyor…</div>;
  }

  if (!user || !isStaff) {
    return (
      <div className="container-page py-24 text-center">
        <h1 className="text-2xl font-semibold">Yetkiniz yok</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Bu alan yalnızca editör ve yöneticiler içindir.
        </p>
        <Button asChild className="mt-6">
          <Link to="/giris">Giriş sayfası</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container-page grid gap-8 py-10 md:grid-cols-[220px_1fr]">
      <aside className="h-fit rounded-xl border border-border bg-card p-3 shadow-card md:sticky md:top-24">
        <p className="px-2 pb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Yönetim
        </p>
        <nav className="flex flex-wrap gap-1 md:flex-col">
          {items.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: "exact" in item ? item.exact : false }}
              activeProps={{ className: "bg-secondary text-secondary-foreground" }}
              className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground"
            >
              <item.icon className="size-4" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="mt-3 border-t border-border pt-3">
          <p className="px-2 text-xs text-muted-foreground">{user.email}</p>
          <Button
            variant="ghost"
            size="sm"
            className="mt-1 w-full justify-start"
            onClick={async () => {
              await supabase.auth.signOut();
              void navigate({ to: "/" });
            }}
          >
            Çıkış yap
          </Button>
        </div>
      </aside>
      <main className="min-w-0">
        <Outlet />
      </main>
    </div>
  );
}
