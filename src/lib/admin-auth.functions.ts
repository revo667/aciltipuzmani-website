import { createMiddleware, createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { createHash, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { USERNAME_PATTERN, usernameToEmail } from "@/lib/staff-login";

type AdminClient = Awaited<typeof import("@/integrations/supabase/client.server")>["supabaseAdmin"];

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

// Istemciden gelen veri tipine guvenilmez; sekil ve uzunluk sunucuda dogrulanir.
const loginInput = z.object({ username: z.string().max(200), password: z.string().max(200) });
const createStaffInput = z.object({
  login: z.string().max(254),
  password: z.string().max(200),
  role: z.enum(["admin", "editor"]),
});
const resetPasswordInput = z.object({ userId: z.string().uuid(), password: z.string().max(200) });
const deleteUserInput = z.object({ userId: z.string().uuid() });

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

/** Ayni IP'den bu pencerede en fazla bu kadar yonetici girisi denenebilir. */
const LOGIN_MAX_ATTEMPTS = 10;
const LOGIN_WINDOW_SECONDS = 15 * 60;

function clientIp() {
  const headers = getRequest()?.headers;
  // Cloudflare bu basligi kendisi yazar; istemci taklit edemez.
  return (
    headers?.get("cf-connecting-ip") ??
    headers?.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}

/**
 * Deneme hakki kaldiysa true. Sinir fonksiyonu henuz kurulu degilse
 * (security_hardening migration'i uygulanmadiysa) yoneticiyi disarida birakmamak
 * icin girisi engellemez, ama loga yazar.
 */
async function allowLoginAttempt(admin: AdminClient) {
  const { data, error } = await admin.rpc("hit_rate_limit", {
    _key: `admin-login:${clientIp()}`,
    _max: LOGIN_MAX_ATTEMPTS,
    _window_seconds: LOGIN_WINDOW_SECONDS,
  });
  if (error?.code === "PGRST202") {
    console.error("[adminLogin] hit_rate_limit bulunamadı; güvenlik migration'ını uygulayın.");
    return true;
  }
  if (error) throw new Error("Giriş şu anda doğrulanamıyor, lütfen tekrar deneyin.");
  return data === true;
}

/** listUsers sayfalidir; hesap ilk sayfada olmayabilir. */
async function findUserIdByEmail(admin: AdminClient, email: string) {
  const perPage = 1000;
  for (let page = 1; page <= 50; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    const match = data.users.find((u) => u.email?.toLowerCase() === email);
    if (match) return match.id;
    if (data.users.length < perPage) break;
  }
  return null;
}

/**
 * Validates the shared admin username/password (stored as server secrets) and
 * makes sure a matching Supabase account with the admin role exists.
 * Returns the e-mail the client should use for signInWithPassword.
 */
export const adminLogin = createServerFn({ method: "POST" })
  .inputValidator(loginInput)
  .handler(async ({ data }) => {
    const expectedUser = process.env["ADMIN_USERNAME"];
    const expectedPass = process.env["ADMIN_PASSWORD"];
    if (!expectedUser || !expectedPass) {
      return { ok: false as const, error: "Yönetici bilgileri sunucuda tanımlı değil." };
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (!(await allowLoginAttempt(supabaseAdmin))) {
      return {
        ok: false as const,
        limited: true as const,
        error: "Çok fazla hatalı deneme. Lütfen 15 dakika sonra tekrar deneyin.",
      };
    }

    const okUser = matches(data.username.trim().toLowerCase(), expectedUser.trim().toLowerCase());
    const okPass = matches(data.password, expectedPass);
    if (!okUser || !okPass) {
      return { ok: false as const, error: "Kullanıcı adı veya şifre hatalı." };
    }

    const email = sharedAdminEmail(expectedUser);

    let userId: string | null;
    try {
      userId = await findUserIdByEmail(supabaseAdmin, email);
    } catch (err) {
      return { ok: false as const, error: (err as Error).message };
    }

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

    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .upsert({ user_id: userId, role: "admin" }, { onConflict: "user_id,role" });
    if (roleError) return { ok: false as const, error: roleError.message };

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
  .inputValidator(createStaffInput)
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
  .inputValidator(resetPasswordInput)
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
  .inputValidator(deleteUserInput)
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.userId);
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });
