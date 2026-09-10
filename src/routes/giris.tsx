import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { adminLogin } from "@/lib/admin-auth.functions";
import { usernameToEmail } from "@/lib/staff-login";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/giris")({
  head: () => ({
    meta: [
      { title: "Yönetici Girişi — aciltip.net" },
      {
        name: "description",
        content: "aciltip.net yönetim paneline yönetici girişi.",
      },
      { property: "og:title", content: "Yönetici Girişi — aciltip.net" },
      { property: "og:description", content: "Yönetim paneline giriş yapın." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminLoginPage,
});

function AdminLoginPage() {
  const navigate = useNavigate();
  const { user, isStaff, loading } = useAuth();
  const login = useServerFn(adminLogin);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user && isStaff) void navigate({ to: "/admin" });
  }, [loading, user, isStaff, navigate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const input = username.trim();
      // E-posta girildiyse panelden eklenen hesaptir; dogrudan Supabase ile giris yapilir.
      // Kullanici adi girildiyse once sunucudaki ortak yonetici bilgisi denenir; tutmazsa
      // panelden kullanici adiyla acilmis hesap olarak giris yapilir.
      let email = input.toLowerCase();
      if (!input.includes("@")) {
        const result = await login({ data: { username: input, password } });
        email = result.ok ? result.email : usernameToEmail(input);
      }
      const { data: signedIn, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        toast.error(
          error.message === "Invalid login credentials"
            ? "Kullanıcı adı / e-posta veya şifre hatalı."
            : error.message,
        );
        return;
      }
      const { data: roleRows } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", signedIn.user.id)
        .in("role", ["admin", "editor"]);
      if (!roleRows?.length) {
        await supabase.auth.signOut();
        toast.error("Bu hesabın yönetim paneline erişim yetkisi yok.");
        return;
      }
      toast.success("Giriş yapıldı");
      void navigate({ to: "/admin" });
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container-page flex justify-center py-20">
      <Card className="w-full max-w-md">
        <CardHeader>
          <span className="mb-2 flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <ShieldCheck className="size-5" />
          </span>
          <CardTitle>Yönetici girişi</CardTitle>
          <CardDescription>
            Bu alan yalnızca yönetici ve editörlere açıktır. E-posta (veya yönetici kullanıcı adı)
            ve şifre ile giriş yapın.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">E-posta veya kullanıcı adı</Label>
              <Input
                id="username"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Şifre</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? "Kontrol ediliyor…" : "Giriş yap"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
