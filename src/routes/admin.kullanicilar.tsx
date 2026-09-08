import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { KeyRound, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { formatDate } from "@/lib/content";
import {
  createStaffUser,
  deleteStaffUser,
  listAdminUsers,
  resetStaffPassword,
} from "@/lib/admin-auth.functions";

export const Route = createFileRoute("/admin/kullanicilar")({
  component: AdminUsers,
});

type Role = "admin" | "editor" | "user";
const roles: Role[] = ["admin", "editor", "user"];
const roleLabels: Record<Role, string> = {
  admin: "Yönetici",
  editor: "Editör",
  user: "Üye",
};
const roleHints: Record<Role, string> = {
  admin: "Her şeyi yapabilir, kullanıcı ekleyip silebilir.",
  editor: "İçerik ekler ve düzenler, kullanıcı yönetemez.",
  user: "Yalnızca siteyi görüntüler.",
};

function randomPassword() {
  const chars = "abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from(crypto.getRandomValues(new Uint32Array(14)))
    .map((n) => chars[n % chars.length])
    .join("");
}

function AdminUsers() {
  const qc = useQueryClient();
  const { isAdmin } = useAuth();
  const [creating, setCreating] = useState(false);
  const [newUser, setNewUser] = useState({
    email: "",
    password: randomPassword(),
    role: "editor" as "admin" | "editor",
  });
  const [resetting, setResetting] = useState<{ id: string; email: string } | null>(null);
  const [newPassword, setNewPassword] = useState("");

  const { data: people = [] } = useQuery({
    queryKey: ["admin", "users"],
    queryFn: async () => {
      const [{ data: profiles, error: pErr }, { data: userRoles, error: rErr }] = await Promise.all(
        [
          supabase.from("profiles").select("id, full_name, created_at"),
          supabase.from("user_roles").select("user_id, role"),
        ],
      );
      if (pErr) throw pErr;
      if (rErr) throw rErr;
      return (profiles ?? []).map((p) => ({
        ...p,
        roles: (userRoles ?? []).filter((r) => r.user_id === p.id).map((r) => r.role as Role),
      }));
    },
  });

  // E-postalar auth.users'ta; istemciden okunamadigi icin sunucu fonksiyonu ile gelir.
  const { data: accounts } = useQuery({
    queryKey: ["admin", "auth-users"],
    enabled: isAdmin,
    queryFn: async () => {
      const result = await listAdminUsers();
      if (!result.ok) throw new Error(result.error);
      return result.users;
    },
  });

  const emailOf = (id: string) => accounts?.find((a) => a.id === id)?.email ?? "";
  const lastSeenOf = (id: string) => accounts?.find((a) => a.id === id)?.lastSignInAt ?? null;

  const toggleRole = useMutation({
    mutationFn: async ({ userId, role, has }: { userId: string; role: Role; has: boolean }) => {
      if (has) {
        const { error } = await supabase
          .from("user_roles")
          .delete()
          .eq("user_id", userId)
          .eq("role", role);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("user_roles").insert({ user_id: userId, role });
        if (error) throw error;
      }
    },
    onSuccess: async () => {
      toast.success("Yetki güncellendi");
      await qc.invalidateQueries();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const create = useMutation({
    mutationFn: async () => {
      const result = await createStaffUser({ data: newUser });
      if (!result.ok) throw new Error(result.error);
      return result;
    },
    onSuccess: async () => {
      toast.success(`${newUser.email} eklendi. Şifreyi kendisine iletin.`);
      setCreating(false);
      setNewUser({ email: "", password: randomPassword(), role: "editor" });
      await qc.invalidateQueries();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const resetPassword = useMutation({
    mutationFn: async () => {
      if (!resetting) return;
      const result = await resetStaffPassword({
        data: { userId: resetting.id, password: newPassword },
      });
      if (!result.ok) throw new Error(result.error);
    },
    onSuccess: () => {
      toast.success("Şifre değiştirildi. Yeni şifreyi kullanıcıya iletin.");
      setResetting(null);
      setNewPassword("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeUser = useMutation({
    mutationFn: async (userId: string) => {
      const result = await deleteStaffUser({ data: { userId } });
      if (!result.ok) throw new Error(result.error);
    },
    onSuccess: async () => {
      toast.success("Kullanıcı silindi");
      await qc.invalidateQueries();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Kullanıcılar</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isAdmin
              ? "Yetki değiştirmek için etiketlere tıklayın."
              : "Kullanıcı yönetimi yalnızca yöneticiler içindir."}
          </p>
        </div>
        {isAdmin ? (
          <Button onClick={() => setCreating(true)}>
            <Plus className="mr-1 size-4" /> Yeni kullanıcı
          </Button>
        ) : null}
      </div>

      {isAdmin ? (
        <div className="mt-6 grid gap-2 rounded-xl border border-border bg-muted/30 p-4 text-xs text-muted-foreground sm:grid-cols-3">
          {roles.map((role) => (
            <p key={role}>
              <strong className="text-foreground">{roleLabels[role]}:</strong> {roleHints[role]}
            </p>
          ))}
        </div>
      ) : null}

      <div className="mt-6 space-y-3">
        {people.map((person) => {
          const email = emailOf(person.id);
          const lastSeen = lastSeenOf(person.id);
          return (
            <div
              key={person.id}
              className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-card sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="truncate font-medium">
                  {email || person.full_name || "İsimsiz kullanıcı"}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {person.full_name && email ? `${person.full_name} · ` : ""}
                  Kayıt: {formatDate(person.created_at)}
                  {lastSeen ? ` · Son giriş: ${formatDate(lastSeen)}` : " · Hiç giriş yapmamış"}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {roles.map((role) => {
                  const has = person.roles.includes(role);
                  return (
                    <Button
                      key={role}
                      size="sm"
                      variant={has ? "default" : "outline"}
                      disabled={!isAdmin || toggleRole.isPending}
                      onClick={() => toggleRole.mutate({ userId: person.id, role, has })}
                    >
                      {roleLabels[role]}
                    </Button>
                  );
                })}
                {isAdmin ? (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      title="Şifre değiştir"
                      onClick={() => {
                        setResetting({ id: person.id, email: email || person.id });
                        setNewPassword(randomPassword());
                      }}
                    >
                      <KeyRound className="size-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      title="Kullanıcıyı sil"
                      onClick={() => {
                        if (
                          confirm(
                            `${email || person.id} kalıcı olarak silinsin mi? Bu işlem geri alınamaz.`,
                          )
                        ) {
                          removeUser.mutate(person.id);
                        }
                      }}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </>
                ) : null}
              </div>
            </div>
          );
        })}
        {people.length === 0 ? <Badge variant="outline">Henüz kayıtlı kullanıcı yok</Badge> : null}
      </div>

      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Yeni kullanıcı</DialogTitle>
            <DialogDescription>
              Hesap hemen oluşur. Şifreyi kopyalayıp kullanıcıya siz iletirsiniz; kullanıcı
              girdikten sonra kendisi değiştirebilir.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>E-posta</Label>
              <Input
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                placeholder="editor@aciltipuzmani.com"
              />
            </div>
            <div className="space-y-2">
              <Label>Şifre</Label>
              <div className="flex gap-2">
                <Input
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className="font-mono text-sm"
                />
                <Button
                  variant="outline"
                  onClick={() => setNewUser({ ...newUser, password: randomPassword() })}
                >
                  Yenile
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">En az 8 karakter.</p>
            </div>
            <div className="space-y-2">
              <Label>Yetki</Label>
              <Select
                value={newUser.role}
                onValueChange={(v) => setNewUser({ ...newUser, role: v as "admin" | "editor" })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="editor">Editör — içerik ekler ve düzenler</SelectItem>
                  <SelectItem value="admin">Yönetici — her şeyi yapabilir</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreating(false)}>
              Vazgeç
            </Button>
            <Button
              disabled={create.isPending || !newUser.email || newUser.password.length < 8}
              onClick={() => create.mutate()}
            >
              {create.isPending ? "Ekleniyor…" : "Kullanıcıyı ekle"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={resetting !== null} onOpenChange={(open) => !open && setResetting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Şifre değiştir</DialogTitle>
            <DialogDescription>{resetting?.email}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Yeni şifre</Label>
            <div className="flex gap-2">
              <Input
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="font-mono text-sm"
              />
              <Button variant="outline" onClick={() => setNewPassword(randomPassword())}>
                Yenile
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetting(null)}>
              Vazgeç
            </Button>
            <Button
              disabled={resetPassword.isPending || newPassword.length < 8}
              onClick={() => resetPassword.mutate()}
            >
              {resetPassword.isPending ? "Değiştiriliyor…" : "Şifreyi değiştir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
