import { createMiddleware, createServerFn } from "@tanstack/react-start";
import { createHash, timingSafeEqual } from "node:crypto";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { USERNAME_PATTERN, usernameToEmail } from "@/lib/staff-login";

/**
 * Asagidaki kullanici yonetimi fonksiyonlari service role anahtarini kullanir,
 * yani RLS'i tamamen atlar. Bu yuzden cagiranin gercekten yonetici oldugu
 * her cagride sunucuda dogrulanir.
 */
const requireAdmin = createMiddleware({ type: "function" })
  .middleware([requireSupabaseAuth])
  .server(async ({ next, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "admin")
      .maybeSingle();
    if (error) throw new Error("Yetki doğrulanamadı.");
    if (!data) throw new Error("Bu işlem için yönetici yetkisi gerekiyor.");
    return next();
  });

function matches(input: string, expected: string) {
  const a = createHash("sha256").update(input, "utf8").digest();
  const b = createHash("sha256").update(expected, "utf8").digest();
  return timingSafeEqual(a, b);
}

/** Ortak yonetici hesabinin Supabase'deki e-postasi. */
function sharedAdminEmail(username: string) {
  return usernameToEmail(
    username
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9._-]/g, ""),
  );
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

    const email = sharedAdminEmail(expectedUser);
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

/** Panelde kullanicilarin e-postasini gostermek icin; auth.users istemciden okunamaz. */
export const listAdminUsers = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
    if (error) return { ok: false as const, error: error.message };

    return {
      ok: true as const,
      users: data.users.map((u) => ({
        id: u.id,
        email: u.email ?? "",
        createdAt: u.created_at,
        lastSignInAt: u.last_sign_in_at ?? null,
      })),
    };
  });

/** Yeni editor/yonetici hesabi olusturur ve rolunu atar. E-posta ya da kullanici adi kabul eder. */
export const createStaffUser = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((data: { login: string; password: string; role: "admin" | "editor" }) => data)
  .handler(async ({ data }) => {
    const login = data.login.trim().toLowerCase();
    let email: string;
    if (login.includes("@")) {
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(login)) {
        return { ok: false as const, error: "Geçerli bir e-posta adresi girin." };
      }
      email = login;
    } else {
      if (!USERNAME_PATTERN.test(login)) {
        return {
          ok: false as const,
          error:
            "Kullanıcı adı 3-32 karakter olmalı; yalnızca harf (Türkçe karakter olmadan), rakam, nokta, tire veya alt çizgi içerebilir.",
        };
      }
      email = usernameToEmail(login);
    }
    // Ortak yonetici hesabi da ayni alan adini kullanir; o hesabi baskasina vermeyelim.
    const adminUser = process.env["ADMIN_USERNAME"];
    if (adminUser && email === sharedAdminEmail(adminUser)) {
      return { ok: false as const, error: "Bu kullanıcı adı kullanılamaz." };
    }
    if (data.password.length < 8) {
      return { ok: false as const, error: "Şifre en az 8 karakter olmalı." };
    }
    if (data.role !== "admin" && data.role !== "editor") {
      return { ok: false as const, error: "Geçersiz rol." };
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: data.password,
      email_confirm: true,
    });
    if (error || !created.user) {
      if (error?.code === "email_exists") {
        return { ok: false as const, error: "Bu e-posta veya kullanıcı adı zaten kayıtlı." };
      }
      return { ok: false as const, error: error?.message ?? "Hesap oluşturulamadı." };
    }

    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .upsert({ user_id: created.user.id, role: data.role }, { onConflict: "user_id,role" });
    if (roleError) return { ok: false as const, error: roleError.message };

    return { ok: true as const, login };
  });

/** Kullanicinin sifresini yonetici olarak degistirir. */
export const resetStaffPassword = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((data: { userId: string; password: string }) => data)
  .handler(async ({ data }) => {
    if (data.password.length < 8) {
      return { ok: false as const, error: "Şifre en az 8 karakter olmalı." };
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.updateUserById(data.userId, {
      password: data.password,
    });
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });

/** Kullaniciyi tamamen siler. */
export const deleteStaffUser = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((data: { userId: string }) => data)
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.userId);
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });
