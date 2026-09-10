/**
 * Supabase hesaplari e-posta ister. Panelden kullanici adiyla acilan hesaplar
 * bu alan adinda bir e-posta olarak saklanir (ortak yonetici hesabi da boyle).
 */
const USERNAME_DOMAIN = "aciltipuzmani.com";

export const USERNAME_PATTERN = /^[a-z0-9._-]{3,32}$/;

export function usernameToEmail(username: string) {
  return `${username.trim().toLowerCase()}@${USERNAME_DOMAIN}`;
}

/** Kullanici adiyla acilmis hesaplarda sahte e-posta yerine kullanici adini dondurur. */
export function loginLabel(email: string) {
  const suffix = `@${USERNAME_DOMAIN}`;
  return email.endsWith(suffix) ? email.slice(0, -suffix.length) : email;
}
