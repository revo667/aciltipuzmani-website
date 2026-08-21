import { createServerFn } from "@tanstack/react-start";
import { createHash, timingSafeEqual } from "node:crypto";

function matches(input: string, expected: string) {
  const a = createHash("sha256").update(input, "utf8").digest();
  const b = createHash("sha256").update(expected, "utf8").digest();
  return timingSafeEqual(a, b);
}

/**
 * Validates the shared admin username/password (stored as server secrets) and
 * makes sure a matching Supabase account with the admin role exists.
 * Returns the e-mail the client should use for signInWithPassword.
 */
export const adminLogin = createServerFn({ method: "POST" })
  .inputValidator((data: { username: string; password: string }) => data)
  .handler(async ({ data }) => {
    const expectedUser = process.env["ADMIN_USERNAME"];
    const expectedPass = process.env["ADMIN_PASSWORD"];
    if (!expectedUser || !expectedPass) {
      return { ok: false as const, error: "Yönetici bilgileri sunucuda tanımlı değil." };
    }
    const okUser = matches(data.username.trim().toLowerCase(), expectedUser.trim().toLowerCase());
    const okPass = matches(data.password, expectedPass);
    if (!okUser || !okPass) {
      return { ok: false as const, error: "Kullanıcı adı veya şifre hatalı." };
    }

    const email = `${expectedUser.trim().toLowerCase().replace(/[^a-z0-9._-]/g, "")}@aciltipuzmani.com`;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: list, error: listErr } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 200,
    });
    if (listErr) return { ok: false as const, error: listErr.message };

    let userId = list.users.find((u) => u.email?.toLowerCase() === email)?.id ?? null;

    if (userId) {
      const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        password: expectedPass,
        email_confirm: true,
      });
      if (error) return { ok: false as const, error: error.message };
    } else {
      const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: expectedPass,
        email_confirm: true,
      });
      if (error || !created.user) {
        return { ok: false as const, error: error?.message ?? "Hesap oluşturulamadı." };
      }
      userId = created.user.id;
    }

    await supabaseAdmin
      .from("user_roles")
      .upsert({ user_id: userId, role: "admin" }, { onConflict: "user_id,role" });

    return { ok: true as const, email };
  });
