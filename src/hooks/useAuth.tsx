import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "admin" | "editor" | "user";

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      if (!nextSession?.user) {
        setRoles([]);
        return;
      }
      const uid = nextSession.user.id;
      setTimeout(() => {
        void supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", uid)
          .then(({ data }) => setRoles(((data ?? []) as { role: AppRole }[]).map((r) => r.role)));
      }, 0);
    });

    void supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      if (data.session?.user) {
        const { data: roleRows } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", data.session.user.id);
        setRoles(((roleRows ?? []) as { role: AppRole }[]).map((r) => r.role));
      }
      setLoading(false);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const isAdmin = roles.includes("admin");
  const isStaff = isAdmin || roles.includes("editor");

  return { session, user, roles, loading, isAdmin, isStaff };
}
