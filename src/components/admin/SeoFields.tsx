import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ImageField } from "@/components/admin/ImageField";
import { settingsQuery } from "@/lib/content";

/**
 * Yazi ve sayfa formlarinin ortak SEO bolumu. Alanlar bos birakilabilir;
 * bos kalirsa baslik/ozet/kapak gorseli kullanilir. Google'da ve sosyal medyada
 * nasil gorunecegi canli onizlemeyle gosterilir.
 */

export type SeoDraft = {
  seo_title: string;
  seo_description: string;
  og_image_url: string;
};

const TITLE_LIMIT = 60;
const DESC_LIMIT = 155;

function Counter({ value, limit }: { value: string; limit: number }) {
  const length = value.length;
  const tone =
    length === 0
      ? "text-muted-foreground"
      : length > limit
        ? "text-destructive"
        : "text-muted-foreground";
  return (
    <span className={`text-xs tabular-nums ${tone}`}>
      {length}/{limit}
    </span>
  );
}

export function SeoFields({
  draft,
  onChange,
  fallbackTitle,
  fallbackDescription,
  fallbackImage,
  folder,
}: {
  draft: SeoDraft;
  onChange: (patch: Partial<SeoDraft>) => void;
  fallbackTitle: string;
  fallbackDescription: string;
  fallbackImage: string;
  folder: string;
}) {
  const { data: settings } = useQuery(settingsQuery());
  const siteName = settings?.siteName ?? "Acil Tıp Uzmanı";

  const effectiveTitle = draft.seo_title || fallbackTitle || "Başlıksız";
  const effectiveDescription =
    draft.seo_description || fallbackDescription || settings?.seoDescription || "";
  const effectiveImage = draft.og_image_url || fallbackImage || settings?.seoOgImageUrl || "";

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Arama motoru başlığı</Label>
          <Counter value={draft.seo_title} limit={TITLE_LIMIT} />
        </div>
        <Input
          value={draft.seo_title}
          onChange={(e) => onChange({ seo_title: e.target.value })}
          placeholder={fallbackTitle || "Boş bırakılırsa içeriğin başlığı kullanılır"}
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Arama motoru açıklaması</Label>
          <Counter value={draft.seo_description} limit={DESC_LIMIT} />
        </div>
        <Textarea
          rows={3}
          value={draft.seo_description}
          onChange={(e) => onChange({ seo_description: e.target.value })}
          placeholder={fallbackDescription || "Boş bırakılırsa özet kullanılır"}
        />
      </div>

      <ImageField
        label="Paylaşım görseli"
        value={draft.og_image_url}
        onChange={(url) => onChange({ og_image_url: url })}
        folder={folder}
        hint="WhatsApp, Facebook ve X'te paylaşıldığında görünecek görsel. Boş bırakılırsa kapak görseli kullanılır. Önerilen ölçü 1200×630."
      />

      <div className="rounded-xl border border-border bg-muted/30 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Google'da böyle görünür
        </p>
        <div className="mt-3">
          <p className="text-xs text-muted-foreground">{siteName}</p>
          <p className="mt-0.5 truncate text-base text-[#1a0dab]">
            {effectiveTitle} — {siteName}
          </p>
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
            {effectiveDescription || "Açıklama girilmemiş."}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-muted/30 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          WhatsApp / sosyal medyada böyle görünür
        </p>
        <div className="mt-3 max-w-sm overflow-hidden rounded-lg border border-border bg-card">
          <div className="flex h-32 items-center justify-center bg-muted">
            {effectiveImage ? (
              <img src={effectiveImage} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="text-xs text-muted-foreground">Görsel yok</span>
            )}
          </div>
          <div className="space-y-1 p-3">
            <p className="truncate text-sm font-medium">{effectiveTitle}</p>
            <p className="line-clamp-2 text-xs text-muted-foreground">
              {effectiveDescription || "Açıklama girilmemiş."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
