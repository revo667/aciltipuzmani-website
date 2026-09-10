import { cn } from "@/lib/utils";
import { sanitizeHtml } from "@/lib/sanitize-html";

/**
 * WordPress'ten aktarılan yazılar HTML olarak saklanıyor; elle girilen
 * eski içerikler ise düz metin olabiliyor. Bu bileşen ikisini de doğru render eder.
 *
 * HTML her render'da allowlist ile temizlenir: panelin "Kaynak" sekmesinden
 * yapıştırılan içerik de dahil, editör hesabı üzerinden script çalıştırılamaz.
 */

const HAS_HTML = /<\/?[a-z][a-z0-9]*(\s[^>]*)?>/i;

export function RichText({ html, className }: { html: string; className?: string }) {
  const value = html ?? "";

  if (!HAS_HTML.test(value)) {
    const paragraphs = value.split(/\n{2,}|\n/).filter((line) => line.trim().length > 0);
    return (
      <div className={cn("rich-text", className)}>
        {paragraphs.map((paragraph, i) => (
          <p key={i}>{paragraph}</p>
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn("rich-text", className)}
      dangerouslySetInnerHTML={{ __html: sanitizeHtml(value) }}
    />
  );
}
