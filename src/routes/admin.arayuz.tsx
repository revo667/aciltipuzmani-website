import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { GripVertical, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ImageField } from "@/components/admin/ImageField";
import {
  defaultSettings,
  fontOptions,
  settingsQuery,
  slugify,
  socialKinds,
  socialLabels,
  type GeneralSettings,
  type SocialKind,
} from "@/lib/content";

export const Route = createFileRoute("/admin/arayuz")({
  component: AdminAppearance,
});

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-6 space-y-5 rounded-xl border border-border bg-card p-6 shadow-card">
      <div>
        <h2 className="font-semibold">{title}</h2>
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}

function ColorField({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (hex: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex items-center gap-3">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-label={label}
          className="size-10 cursor-pointer rounded-lg border border-border bg-transparent p-1"
        />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-32 font-mono text-xs uppercase"
        />
      </div>
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function AdminAppearance() {
  const qc = useQueryClient();
  const { data } = useQuery(settingsQuery());
  const [form, setForm] = useState<GeneralSettings>(defaultSettings);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (data) {
      setForm(data);
      setDirty(false);
    }
  }, [data]);

  const set = <K extends keyof GeneralSettings>(key: K, value: GeneralSettings[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setDirty(true);
  };

  const save = useMutation({
    mutationFn: async (input: GeneralSettings) => {
      const { error } = await supabase
        .from("site_settings")
        .upsert({ key: "general", value: input, updated_at: new Date().toISOString() });
      if (error) throw error;
    },
    onSuccess: async () => {
      toast.success("Kaydedildi. Değişiklikler sitede canlı.");
      setDirty(false);
      await qc.invalidateQueries();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="max-w-3xl pb-24">
      <h1 className="text-2xl font-semibold">Arayüz</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Logo, renkler, alt bilgi, SEO ve hata sayfaları. Kaydettiğiniz an sitede görünür.
      </p>

      <Tabs defaultValue="brand" className="mt-6">
        <TabsList className="flex-wrap">
          <TabsTrigger value="brand">Marka</TabsTrigger>
          <TabsTrigger value="theme">Renk & yazı tipi</TabsTrigger>
          <TabsTrigger value="footer">Alt bilgi</TabsTrigger>
          <TabsTrigger value="seo">SEO & analitik</TabsTrigger>
          <TabsTrigger value="groups">Bölümler</TabsTrigger>
          <TabsTrigger value="errors">Hata sayfaları</TabsTrigger>
        </TabsList>

        {/* ── Marka ─────────────────────────────────────────────── */}
        <TabsContent value="brand">
          <Section
            title="Logo ve site kimliği"
            description="Üst menüdeki logo ve site adı, tarayıcı sekmesindeki simge."
          >
            <ImageField
              label="Logo"
              value={form.logoUrl}
              onChange={(url) => set("logoUrl", url)}
              folder="brand"
              hint="Arka planı şeffaf PNG en iyi sonucu verir."
            />
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Logo yüksekliği</Label>
                <span className="text-sm tabular-nums text-muted-foreground">
                  {form.logoHeight} piksel
                </span>
              </div>
              <Slider
                min={24}
                max={140}
                step={2}
                value={[form.logoHeight]}
                onValueChange={([v]) => set("logoHeight", v ?? 72)}
              />
            </div>
            <ImageField
              label="Site simgesi (favicon)"
              value={form.faviconUrl}
              onChange={(url) => set("faviconUrl", url)}
              folder="brand"
              hint="Tarayıcı sekmesinde görünen küçük simge. Kare, 64×64 veya daha büyük olmalı."
              previewClassName="h-16"
            />
            <div className="space-y-2">
              <Label>Site adı</Label>
              <Input value={form.siteName} onChange={(e) => set("siteName", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Slogan</Label>
              <Input value={form.tagline} onChange={(e) => set("tagline", e.target.value)} />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <Label>Logonun yanında site adını göster</Label>
                <p className="text-xs text-muted-foreground">
                  Logonuzda zaten site adı yazıyorsa kapatın.
                </p>
              </div>
              <Switch
                checked={form.showBrandText}
                onCheckedChange={(v) => set("showBrandText", v)}
              />
            </div>
          </Section>

          <Section title="Duyuru şeridi" description="Sitenin en üstünde çıkan ince şerit.">
            <div className="space-y-2">
              <Label>Duyuru metni</Label>
              <Input
                value={form.announcement}
                onChange={(e) => set("announcement", e.target.value)}
                placeholder="Örn. 15 Kasım'daki kongre kayıtları başladı."
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <Label>Duyuru şeridini göster</Label>
              <Switch
                checked={form.showAnnouncement}
                onCheckedChange={(v) => set("showAnnouncement", v)}
              />
            </div>
          </Section>

          <Section title="Anasayfa üst bölümü">
            <div className="space-y-2">
              <Label>Anasayfa başlığı</Label>
              <Input value={form.heroTitle} onChange={(e) => set("heroTitle", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Anasayfa alt metni</Label>
              <Textarea
                rows={3}
                value={form.heroSubtitle}
                onChange={(e) => set("heroSubtitle", e.target.value)}
              />
            </div>
            <Button asChild variant="outline">
              <Link to="/admin/anasayfa">Anasayfa bölümlerini düzenle</Link>
            </Button>
          </Section>

          <Section title="Site içi arama">
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <Label>Arama kutusunu göster</Label>
                <p className="text-xs text-muted-foreground">
                  Üst menüde büyüteç simgesi çıkar; /ara sayfasında sonuçlar listelenir.
                </p>
              </div>
              <Switch
                checked={form.searchEnabled}
                onCheckedChange={(v) => set("searchEnabled", v)}
              />
            </div>
          </Section>
        </TabsContent>

        {/* ── Renk & yazı tipi ──────────────────────────────────── */}
        <TabsContent value="theme">
          <Section
            title="Renkler"
            description="Düğmeler, bağlantılar ve vurgular bu renkleri kullanır."
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <ColorField
                label="Ana renk"
                hint="Düğmeler, bağlantılar, vurgular."
                value={form.themePrimary}
                onChange={(hex) => set("themePrimary", hex)}
              />
              <ColorField
                label="Koyu marka rengi"
                hint="Üst bant ve alt bilgi zemini."
                value={form.themeBrandDeep}
                onChange={(hex) => set("themeBrandDeep", hex)}
              />
              <ColorField
                label="Vurgu rengi"
                hint="Rozetler ve açık zeminli vurgular."
                value={form.themeAccent}
                onChange={(hex) => set("themeAccent", hex)}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Köşe yuvarlaklığı</Label>
                <span className="text-sm tabular-nums text-muted-foreground">
                  {form.themeRadius} piksel
                </span>
              </div>
              <Slider
                min={0}
                max={28}
                step={1}
                value={[form.themeRadius]}
                onValueChange={([v]) => set("themeRadius", v ?? 12)}
              />
            </div>

            <div className="rounded-xl border border-border p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Önizleme
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <span
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-white"
                  style={{
                    background: form.themePrimary,
                    borderRadius: `${form.themeRadius}px`,
                    fontFamily: form.fontBody,
                  }}
                >
                  Düğme
                </span>
                <span
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-white"
                  style={{
                    background: form.themeBrandDeep,
                    borderRadius: `${form.themeRadius}px`,
                    fontFamily: form.fontBody,
                  }}
                >
                  Alt bilgi
                </span>
                <span
                  className="inline-flex items-center px-3 py-1 text-xs font-medium"
                  style={{
                    background: form.themeAccent,
                    borderRadius: `${form.themeRadius}px`,
                    fontFamily: form.fontBody,
                  }}
                >
                  Rozet
                </span>
              </div>
              <p
                className="mt-4 text-lg font-semibold"
                style={{ fontFamily: `"${form.fontDisplay}", sans-serif` }}
              >
                Örnek başlık: Acil Serviste Sepsis Yönetimi
              </p>
              <p
                className="mt-1 text-sm text-muted-foreground"
                style={{ fontFamily: `"${form.fontBody}", sans-serif` }}
              >
                Örnek gövde metni. Yazı tipini değiştirdiğinizde bu satır da değişir.
              </p>
            </div>
          </Section>

          <Section
            title="Yazı tipleri"
            description="Tümü Google Fonts üzerinden yüklenir, ek kurulum gerekmez."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Başlık yazı tipi</Label>
                <Select value={form.fontDisplay} onValueChange={(v) => set("fontDisplay", v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {fontOptions.map((font) => (
                      <SelectItem key={font} value={font}>
                        {font}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Gövde yazı tipi</Label>
                <Select value={form.fontBody} onValueChange={(v) => set("fontBody", v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {fontOptions.map((font) => (
                      <SelectItem key={font} value={font}>
                        {font}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Section>
        </TabsContent>

        {/* ── Alt bilgi ─────────────────────────────────────────── */}
        <TabsContent value="footer">
          <Section title="Alt bilgi tanıtım yazısı">
            <div className="space-y-2">
              <Label>Site adının altındaki kısa metin</Label>
              <Textarea
                rows={3}
                value={form.footerAbout}
                onChange={(e) => set("footerAbout", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Telif satırı</Label>
              <Input value={form.copyright} onChange={(e) => set("copyright", e.target.value)} />
              <p className="text-xs text-muted-foreground">
                <code className="rounded bg-muted px-1">{"{yil}"}</code> yazdığınız yere içinde
                bulunulan yıl otomatik gelir.
              </p>
            </div>
          </Section>

          <Section title="İletişim bilgileri" description="Alt bilgideki iletişim sütunu.">
            <div className="space-y-2">
              <Label>E-posta</Label>
              <Input
                value={form.contactEmail}
                onChange={(e) => set("contactEmail", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Telefon</Label>
              <Input
                value={form.contactPhone}
                onChange={(e) => set("contactPhone", e.target.value)}
                placeholder="0212 000 00 00"
              />
            </div>
            <div className="space-y-2">
              <Label>Adres</Label>
              <Textarea
                rows={3}
                value={form.contactAddress}
                onChange={(e) => set("contactAddress", e.target.value)}
              />
            </div>
          </Section>

          <Section
            title="Alt bilgi bağlantı sütunları"
            description="Her sütun bir başlık ve altındaki bağlantılardan oluşur."
          >
            {form.footerColumns.map((column, ci) => (
              <div key={ci} className="space-y-3 rounded-lg border border-border p-4">
                <div className="flex items-center gap-2">
                  <Input
                    value={column.title}
                    onChange={(e) => {
                      const next = [...form.footerColumns];
                      next[ci] = { ...column, title: e.target.value };
                      set("footerColumns", next);
                    }}
                    placeholder="Sütun başlığı"
                    className="font-medium"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label="Sütunu sil"
                    onClick={() =>
                      set(
                        "footerColumns",
                        form.footerColumns.filter((_, i) => i !== ci),
                      )
                    }
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>

                {column.links.map((link, li) => (
                  <div key={li} className="flex items-center gap-2 pl-2">
                    <GripVertical className="size-4 shrink-0 text-muted-foreground" />
                    <Input
                      value={link.label}
                      onChange={(e) => {
                        const next = [...form.footerColumns];
                        const links = [...column.links];
                        links[li] = { ...link, label: e.target.value };
                        next[ci] = { ...column, links };
                        set("footerColumns", next);
                      }}
                      placeholder="Görünen ad"
                    />
                    <Input
                      value={link.href}
                      onChange={(e) => {
                        const next = [...form.footerColumns];
                        const links = [...column.links];
                        links[li] = { ...link, href: e.target.value };
                        next[ci] = { ...column, links };
                        set("footerColumns", next);
                      }}
                      placeholder="/haberler"
                      className="font-mono text-xs"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label="Bağlantıyı sil"
                      onClick={() => {
                        const next = [...form.footerColumns];
                        next[ci] = { ...column, links: column.links.filter((_, i) => i !== li) };
                        set("footerColumns", next);
                      }}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                ))}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const next = [...form.footerColumns];
                    next[ci] = { ...column, links: [...column.links, { label: "", href: "/" }] };
                    set("footerColumns", next);
                  }}
                >
                  <Plus className="mr-1 size-3.5" /> Bağlantı ekle
                </Button>
              </div>
            ))}

            <Button
              variant="outline"
              onClick={() =>
                set("footerColumns", [...form.footerColumns, { title: "Yeni sütun", links: [] }])
              }
            >
              <Plus className="mr-1 size-4" /> Sütun ekle
            </Button>
          </Section>

          <Section
            title="Sosyal medya"
            description="Alt bilgide simge olarak görünür. Boş bırakırsanız hiçbiri çıkmaz."
          >
            {form.socialLinks.map((link, i) => (
              <div key={i} className="flex items-center gap-2">
                <Select
                  value={link.kind}
                  onValueChange={(v) => {
                    const next = [...form.socialLinks];
                    next[i] = { ...link, kind: v as SocialKind };
                    set("socialLinks", next);
                  }}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {socialKinds.map((kind) => (
                      <SelectItem key={kind} value={kind}>
                        {socialLabels[kind]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  value={link.url}
                  onChange={(e) => {
                    const next = [...form.socialLinks];
                    next[i] = { ...link, url: e.target.value };
                    set("socialLinks", next);
                  }}
                  placeholder="https://instagram.com/hesabiniz"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label="Hesabı sil"
                  onClick={() =>
                    set(
                      "socialLinks",
                      form.socialLinks.filter((_, idx) => idx !== i),
                    )
                  }
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
            <Button
              variant="outline"
              onClick={() =>
                set("socialLinks", [...form.socialLinks, { kind: "instagram", url: "" }])
              }
            >
              <Plus className="mr-1 size-4" /> Hesap ekle
            </Button>
            <p className="text-xs text-muted-foreground">
              Adres <code className="rounded bg-muted px-1">https://</code> ile başlamalı, aksi
              halde kaydedilmez.
            </p>
          </Section>
        </TabsContent>

        {/* ── SEO ───────────────────────────────────────────────── */}
        <TabsContent value="seo">
          <Section
            title="Arama motoru bilgileri"
            description="Anasayfa ve kendi SEO alanı doldurulmamış içerikler için kullanılır."
          >
            <div className="space-y-2">
              <Label>Site başlığı</Label>
              <Input value={form.seoTitle} onChange={(e) => set("seoTitle", e.target.value)} />
              <p className="text-xs text-muted-foreground">
                Google sonuçlarında ve tarayıcı sekmesinde görünür. 60 karakteri geçmemeye çalışın.
              </p>
            </div>
            <div className="space-y-2">
              <Label>Site açıklaması</Label>
              <Textarea
                rows={3}
                value={form.seoDescription}
                onChange={(e) => set("seoDescription", e.target.value)}
              />
            </div>
            <ImageField
              label="Varsayılan paylaşım görseli"
              value={form.seoOgImageUrl}
              onChange={(url) => set("seoOgImageUrl", url)}
              folder="brand"
              hint="Site bağlantısı WhatsApp veya Facebook'ta paylaşıldığında görünür. Önerilen ölçü 1200×630."
            />
            <div className="space-y-2">
              <Label>X (Twitter) hesabı</Label>
              <Input
                value={form.twitterHandle}
                onChange={(e) => set("twitterHandle", e.target.value)}
                placeholder="@aciltipuzmani"
              />
            </div>
          </Section>

          <Section title="Analitik ve doğrulama">
            <div className="space-y-2">
              <Label>Google Analytics ölçüm kimliği</Label>
              <Input
                value={form.gaMeasurementId}
                onChange={(e) => set("gaMeasurementId", e.target.value.trim())}
                placeholder="G-XXXXXXXXXX"
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Google Analytics'te "Veri akışı" ekranındaki <strong>G-</strong> ile başlayan kod.
                Boş bırakırsanız hiçbir takip kodu yüklenmez.
              </p>
            </div>
            <div className="space-y-2">
              <Label>Google Search Console doğrulama kodu</Label>
              <Input
                value={form.searchConsoleToken}
                onChange={(e) => set("searchConsoleToken", e.target.value.trim())}
                placeholder="google-site-verification değeri"
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Search Console "HTML etiketi" yöntemini seçtiğinizde verdiği{" "}
                <code className="rounded bg-muted px-1">content</code> değeri.
              </p>
            </div>
          </Section>

          <Section title="Site haritası">
            <p className="text-sm text-muted-foreground">
              Site haritanız otomatik oluşuyor ve her yeni yazıda kendini günceller. Google Search
              Console'a şu adresi ekleyin:
            </p>
            <code className="block rounded-lg bg-muted p-3 text-sm">
              https://aciltipuzmani.com/sitemap.xml
            </code>
          </Section>

          <Section title="Arama motorlarına kapatma">
            <div className="flex items-center justify-between rounded-lg border border-destructive/40 bg-destructive/5 p-3">
              <div>
                <Label>Siteyi arama motorlarından gizle</Label>
                <p className="text-xs text-muted-foreground">
                  Açıkken Google siteyi listelemez. Yalnızca site hazırlık aşamasındayken açın,
                  yayına geçince kapatmayı unutmayın.
                </p>
              </div>
              <Switch checked={form.seoNoindex} onCheckedChange={(v) => set("seoNoindex", v)} />
            </div>
          </Section>
        </TabsContent>

        {/* ── Bölümler ──────────────────────────────────────────── */}
        <TabsContent value="groups">
          <Section
            title="Dernek & yayın bölümleri"
            description="Kaynaklar sayfasındaki başlıklar. Anahtar, adres satırında kullanılır (/kaynaklar/dernek)."
          >
            {form.linkGroups.map((group, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input
                  value={group.title}
                  onChange={(e) => {
                    const next = [...form.linkGroups];
                    next[i] = { ...group, title: e.target.value };
                    set("linkGroups", next);
                  }}
                  placeholder="Bölüm başlığı"
                />
                <Input
                  value={group.kind}
                  onChange={(e) => {
                    const next = [...form.linkGroups];
                    next[i] = { ...group, kind: slugify(e.target.value) };
                    set("linkGroups", next);
                  }}
                  placeholder="anahtar"
                  className="w-40 font-mono text-xs"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label="Bölümü sil"
                  onClick={() =>
                    set(
                      "linkGroups",
                      form.linkGroups.filter((_, idx) => idx !== i),
                    )
                  }
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
            <Button
              variant="outline"
              onClick={() => set("linkGroups", [...form.linkGroups, { kind: "", title: "" }])}
            >
              <Plus className="mr-1 size-4" /> Bölüm ekle
            </Button>
            <p className="rounded-lg border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
              <strong className="text-foreground">Dikkat:</strong> Anahtarı değiştirirseniz o
              bölümdeki bağlantılar görünmez olur. Bağlantıların bölümünü{" "}
              <Link to="/admin/baglantilar" className="text-primary hover:underline">
                Dernek & Yayın
              </Link>{" "}
              ekranından da güncellemeniz gerekir.
            </p>
          </Section>

          <Section title="Sorumluluk metni" description="Kaynaklar listesinin altındaki uyarı.">
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <Label>Sorumluluk metnini göster</Label>
              <Switch
                checked={form.showDisclaimer}
                onCheckedChange={(v) => set("showDisclaimer", v)}
              />
            </div>
            <Textarea
              rows={3}
              value={form.disclaimerText}
              onChange={(e) => set("disclaimerText", e.target.value)}
            />
          </Section>
        </TabsContent>

        {/* ── Hata sayfaları ────────────────────────────────────── */}
        <TabsContent value="errors">
          <Section
            title="Sayfa bulunamadı (404)"
            description="Ziyaretçi olmayan bir adrese girdiğinde görünen sayfa."
          >
            <div className="space-y-2">
              <Label>Başlık</Label>
              <Input
                value={form.notFoundTitle}
                onChange={(e) => set("notFoundTitle", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Açıklama</Label>
              <Textarea
                rows={2}
                value={form.notFoundMessage}
                onChange={(e) => set("notFoundMessage", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Düğme yazısı</Label>
              <Input
                value={form.notFoundButton}
                onChange={(e) => set("notFoundButton", e.target.value)}
              />
            </div>
          </Section>

          <Section title="Teknik hata sayfası" description="Bir aksilik olduğunda görünen sayfa.">
            <div className="space-y-2">
              <Label>Başlık</Label>
              <Input value={form.errorTitle} onChange={(e) => set("errorTitle", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Açıklama</Label>
              <Textarea
                rows={2}
                value={form.errorMessage}
                onChange={(e) => set("errorMessage", e.target.value)}
              />
            </div>
          </Section>
        </TabsContent>
      </Tabs>

      {/* Hangi sekmede olursa olsun kaydetme cubugu ekranda kalir. */}
      <div className="sticky bottom-0 mt-8 flex items-center justify-between gap-4 rounded-xl border border-border bg-card/95 p-4 shadow-elevated backdrop-blur">
        <p className="text-sm text-muted-foreground">
          {dirty ? "Kaydedilmemiş değişiklikleriniz var." : "Tüm değişiklikler kaydedildi."}
        </p>
        <div className="flex gap-2">
          {dirty && data ? (
            <Button
              variant="outline"
              onClick={() => {
                setForm(data);
                setDirty(false);
              }}
            >
              Geri al
            </Button>
          ) : null}
          <Button disabled={save.isPending || !dirty} onClick={() => save.mutate(form)}>
            {save.isPending ? "Kaydediliyor…" : "Kaydet"}
          </Button>
        </div>
      </div>
    </div>
  );
}
