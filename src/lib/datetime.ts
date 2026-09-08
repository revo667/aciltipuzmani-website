/**
 * <input type="datetime-local"> ile veritabanindaki ISO timestamp arasinda cevrim.
 * Girdi tarayicinin yerel saatine gore calisir; siteyi yoneten kisi Turkiye'de
 * oldugu icin girdigi saat bekledigi saattir.
 */

function pad(n: number) {
  return String(n).padStart(2, "0");
}

/** ISO timestamp -> "2026-09-08T14:30" (yerel saat). Bos deger bos string doner. */
export function toLocalInput(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** "2026-09-08T14:30" -> ISO timestamp. Gecersiz/bos girdi null doner. */
export function fromLocalInput(value: string): string | null {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}
