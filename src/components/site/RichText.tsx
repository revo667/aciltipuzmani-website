import { cn } from "@/lib/utils";

/**
 * WordPress'ten aktarılan yazılar HTML olarak saklanıyor; elle girilen
 * eski içerikler ise düz metin olabiliyor. Bu bileşen ikisini de doğru render eder.
 *
 * İçerik zaten aktarım sırasında allowlist ile temizlendi. Buradaki temizlik
 * ikinci savunma katmanı: admin panelinden yapıştırılan içerik için de geçerli.
 */

const HAS_HTML = /<\/?[a-z][a-z0-9]*(\s[^>]*)?>/i;

function sanitize(input: string): string {
  return input
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<\s*(script|style|iframe|object|embed|form|link|meta)\b[\s\S]*?<\s*\/\s*\1\s*>/gi, "")
    .replace(/<\s*(script|style|iframe|object|embed|form|link|meta)\b[^>]*>/gi, "")
    .replace(/\son[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(
      /\s(?:href|src)\s*=\s*(?:"\s*(?:javascript|vbscript|data):[^"]*"|'\s*(?:javascript|vbscript|data):[^']*')/gi,
      "",
    );
}

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
      dangerouslySetInnerHTML={{ __html: sanitize(value) }}
    />
  );
}
