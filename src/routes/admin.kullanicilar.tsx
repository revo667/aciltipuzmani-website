import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

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

function AdminUsers() {
  const qc = useQueryClient();
  const { isAdmin } = useAuth();

  const { data: people = [] } = useQuery({
    queryKey: ["admin", "users"],
    queryFn: async () => {
      const [{ data: profiles, error: pErr }, { data: userRoles, error: rErr }] = await Promise.all([
        supabase.from("profiles").select("id, full_name, created_at"),
        supabase.from("user_roles").select("user_id, role"),
      ]);
      if (pErr) throw pErr;
      if (rErr) throw rErr;
      return (profiles ?? []).map((p) => ({
        ...p,
        roles: (userRoles ?? []).filter((r) => r.user_id === p.id).map((r) => r.role as Role),
      }));
    },
  });

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

  return (
    <div>
      <h1 className="text-2xl font-semibold">Kullanıcılar</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {isAdmin
          ? "Rolleri değiştirmek için etiketlere tıklayın."
          : "Rol değişikliği yalnızca yöneticiler tarafından yapılabilir."}
      </p>

      <div className="mt-8 space-y-3">
        {people.map((person) => (
          <div
            key={person.id}
            className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-card sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <p className="truncate font-medium">{person.full_name ?? "İsimsiz kullanıcı"}</p>
              <p className="mt-1 text-xs text-muted-foreground">{person.id}</p>
            </div>
            <div className="flex flex-wrap gap-2">
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
            </div>
          </div>
        ))}
        {people.length === 0 ? (
          <Badge variant="outline">Henüz kayıtlı kullanıcı yok</Badge>
        ) : null}
      </div>
    </div>
  );
}
