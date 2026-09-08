import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CalendarDays, Globe, LayoutGrid, LinkIcon, Newspaper } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  categoriesQuery,
  defaultSettings,
  settingsQuery,
  type GeneralSettings,
} from "@/lib/content";

export const Route = createFileRoute("/admin/anasayfa")({
  component: AdminHome,
});

function Section({
  icon: Icon,
  title,
  description,
  enabled,
  onToggle,
  children,
}: {
  icon: typeof Newspaper;
  title: string;
  description: string;
  enabled: boolean;
  onToggle: (value: boolean) => void;
  children?: React.ReactNode;
}) {
  return (
    <section className="mt-6 space-y-5 rounded-xl border border-border bg-card p-6 shadow-card">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
          <Icon className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-semibold">{title}</h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <Switch
          checked={enabled}
          onCheckedChange={onToggle}
          aria-label={`${title} bölümünü göster`}
        />
      </div>
      {enabled ? <div className="space-y-5">{children}</div> : null}
    </section>
  );
}

/** Kategori secimi: hicbiri isaretli degilse tum kategoriler gecerli sayilir. */
function CategoryPicker({
  categories,
  selected,
  onChange,
  emptyLabel,
}: {
  categories: { id: string; name: string; slug: string }[];
  selected: string[];
  onChange: (slugs: string[]) => void;
  emptyLabel: string;
}) {
  if (categories.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Henüz kategori yok.{" "}
        <Link to="/admin/kategoriler" className="text-primary hover:underline">
          Kategori & Etiket
        </Link>{" "}
        ekranından ekleyebilirsiniz.
      </p>
    );
  }

  const toggle = (slug: string, on: boolean) =>
    onChange(on ? [...selected, slug] : selected.filter((s) => s !== slug));

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => {
          const on = selected.includes(category.slug);
          return (
            <label
              key={category.id}
              className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
                on ? "border-primary bg-primary/5 font-medium" : "border-border"
              }`}
            >
              <Checkbox checked={on} onCheckedChange={(v) => toggle(category.slug, v === true)} />
              {category.name}
            </label>
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground">
        {selected.length === 0 ? emptyLabel : `${selected.length} kategori seçili.`}
      </p>
      {selected.length > 0 ? (
        <Button variant="ghost" size="sm" className="-ml-2" onClick={() => onChange([])}>
          Seçimi temizle
        </Button>
      ) : null}
    </div>
  );
}

function AdminHome() {
  const qc = useQueryClient();
  const { data } = useQuery(settingsQuery());
  const { data: categories = [], isError: categoriesFailed } = useQuery(categoriesQuery());
  const [form, setForm] = useState<GeneralSettings>(defaultSettings);

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  const set = <K extends keyof GeneralSettings>(key: K, value: GeneralSettings[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const save = useMutation({
    mutationFn: async (input: GeneralSettings) => {
      const { error } = await supabase
        .from("site_settings")
        .upsert({ key: "general", value: input, updated_at: new Date().toISOString() });
      if (error) throw error;
    },
    onSuccess: async () => {
      toast.success("Anasayfa ayarları kaydedildi");
      await qc.invalidateQueries();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const feedCount = form.homeFeedColumns * form.homeFeedRows;

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold">Anasayfa</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Anasayfadaki bölümlerin görünürlüğü, başlıkları, kaç içerik gösterileceği ve hangi
        kategorilerin yer alacağı.
      </p>

      {categoriesFailed ? (
        <p className="mt-4 rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
          Kategori listesi okunamadı. Kategori tabloları henüz oluşturulmamış olabilir; kategori
          filtreleri boş görünür ve anasayfa filtresiz çalışır.
        </p>
      ) : null}

      <Section
        icon={LayoutGrid}
        title="Vitrin"
        description="Sayfanın en üstündeki büyük görselli kutular."
        enabled={form.homeFeaturedEnabled}
        onToggle={(v) => set("homeFeaturedEnabled", v)}
      >
        <div className="space-y-2">
          <Label>Kaç yazı gösterilsin</Label>
          <Input
            type="number"
            min={1}
            max={6}
            value={form.homeFeaturedCount}
            onChange={(e) => set("homeFeaturedCount", Number(e.target.value))}
          />
          <p className="text-xs text-muted-foreground">
            İlki büyük, kalanlar sağ sütunda. Yeterli yazı yoksa boş kutular “Tüm haberler”
            bağlantısına dönüşür.
          </p>
        </div>
        <div className="space-y-2">
          <Label>Vitrine girecek kategoriler</Label>
          <CategoryPicker
            categories={categories}
            selected={form.homeFeaturedCategories}
            onChange={(slugs) => set("homeFeaturedCategories", slugs)}
            emptyLabel="Hiçbiri seçili değil: tüm kategoriler vitrine girebilir."
          />
        </div>
      </Section>

      <Section
        icon={Newspaper}
        title="Son yazılar"
        description="Vitrinin altındaki kart listesi."
        enabled={form.homeFeedEnabled}
        onToggle={(v) => set("homeFeedEnabled", v)}
      >
        <div className="space-y-2">
          <Label>Bölüm başlığı</Label>
          <Input value={form.newsTitle} onChange={(e) => set("newsTitle", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Bölüm açıklaması</Label>
          <Input value={form.newsSubtitle} onChange={(e) => set("newsSubtitle", e.target.value)} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Sütun sayısı</Label>
            <Select
              value={String(form.homeFeedColumns)}
              onValueChange={(v) => set("homeFeedColumns", Number(v))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2">2 sütun</SelectItem>
                <SelectItem value="3">3 sütun</SelectItem>
                <SelectItem value="4">4 sütun</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Satır sayısı</Label>
            <Input
              type="number"
              min={1}
              max={8}
              value={form.homeFeedRows}
              onChange={(e) => set("homeFeedRows", Number(e.target.value))}
            />
          </div>
        </div>
        <p className="-mt-2 text-xs text-muted-foreground">
          Toplam {feedCount} içerik gösterilir. (Mobilde kartlar tek sütuna iner.)
        </p>

        <div className="space-y-2">
          <Label>Sıralama</Label>
          <Select
            value={form.homeFeedOrder}
            onValueChange={(v) => set("homeFeedOrder", v === "category" ? "category" : "date")}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Tarihe göre (en yeni önce)</SelectItem>
              <SelectItem value="category">Kategori sırasına göre</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Kategori sırası seçilirse hangi kategorinin önce geleceğini{" "}
            <Link to="/admin/kategoriler" className="text-primary hover:underline">
              Kategori & Etiket
            </Link>{" "}
            ekranındaki “Sıra” alanı belirler. Aynı sıradakiler kendi içinde tarihe göre dizilir.
          </p>
        </div>

        <div className="space-y-2">
          <Label>Gösterilecek kategoriler</Label>
          <CategoryPicker
            categories={categories}
            selected={form.homeFeedCategories}
            onChange={(slugs) => set("homeFeedCategories", slugs)}
            emptyLabel="Hiçbiri seçili değil: tüm kategorilerden yazı gelir."
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <span>
              <Label>Etkinlikler de listelensin</Label>
              <span className="block text-xs text-muted-foreground">
                Kapalıyken etkinlikler yalnızca kendi bölümünde ve takvim sayfasında görünür.
              </span>
            </span>
            <Switch
              checked={form.homeFeedIncludeEvents}
              onCheckedChange={(v) => set("homeFeedIncludeEvents", v)}
            />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <span>
              <Label>Dış yazılar da listelensin</Label>
              <span className="block text-xs text-muted-foreground">
                Başka sitelerden eklediğiniz bağlantılar.
              </span>
            </span>
            <Switch
              checked={form.homeFeedIncludeExternal}
              onCheckedChange={(v) => set("homeFeedIncludeExternal", v)}
            />
          </div>
        </div>
      </Section>

      <Section
        icon={Globe}
        title="Dış yazılar şeridi"
        description="Diğer acil tıp sitelerinden derlenen yazılar."
        enabled={form.homeExternalEnabled}
        onToggle={(v) => set("homeExternalEnabled", v)}
      >
        <div className="space-y-2">
          <Label>Bölüm başlığı</Label>
          <Input
            value={form.externalTitle}
            onChange={(e) => set("externalTitle", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Bölüm açıklaması</Label>
          <Input
            value={form.externalSubtitle}
            onChange={(e) => set("externalSubtitle", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>“Tümünü gör” bağlantısı</Label>
          <Input
            placeholder="https://ornek.com/yazilar"
            value={form.externalAllUrl}
            onChange={(e) => set("externalAllUrl", e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Boş bırakılırsa site içi <code className="text-xs">/dis-yazilar</code> sayfasına gider.
          </p>
        </div>
      </Section>

      <Section
        icon={CalendarDays}
        title="Etkinlikler"
        description="Anasayfadaki kayan etkinlik şeridi."
        enabled={form.homeEventsEnabled}
        onToggle={(v) => set("homeEventsEnabled", v)}
      >
        <div className="space-y-2">
          <Label>Bölüm başlığı</Label>
          <Input value={form.eventsTitle} onChange={(e) => set("eventsTitle", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Bölüm açıklaması</Label>
          <Input
            value={form.eventsSubtitle}
            onChange={(e) => set("eventsSubtitle", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Kaç etkinlik gösterilsin</Label>
          <Input
            type="number"
            min={3}
            max={40}
            value={form.homeEventsLimit}
            onChange={(e) => set("homeEventsLimit", Number(e.target.value))}
          />
          <p className="text-xs text-muted-foreground">Tarihi en yakın etkinliklerden başlanır.</p>
        </div>
      </Section>

      <Section
        icon={LinkIcon}
        title="Dernekler ve yayınlar"
        description="Sayfanın altındaki logo duvarı."
        enabled={form.homeLinksEnabled}
        onToggle={(v) => set("homeLinksEnabled", v)}
      >
        <div className="space-y-2">
          <Label>Bölüm başlığı</Label>
          <Input value={form.linksTitle} onChange={(e) => set("linksTitle", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Bölüm açıklaması</Label>
          <Input
            value={form.linksSubtitle}
            onChange={(e) => set("linksSubtitle", e.target.value)}
          />
        </div>
      </Section>

      <div className="sticky bottom-4 mt-6 rounded-xl border border-border bg-card/95 p-4 shadow-card backdrop-blur">
        <Button className="w-full" disabled={save.isPending} onClick={() => save.mutate(form)}>
          {save.isPending ? "Kaydediliyor…" : "Kaydet"}
        </Button>
      </div>
    </div>
  );
}
