import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { defaultSettings, settingsQuery, type GeneralSettings } from "@/lib/content";

export const Route = createFileRoute("/admin/arayuz")({
  component: AdminAppearance,
});

function AdminAppearance() {
  const qc = useQueryClient();
  const { data } = useQuery(settingsQuery());
  const [form, setForm] = useState<GeneralSettings>(defaultSettings);

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  const save = useMutation({
    mutationFn: async (input: GeneralSettings) => {
      const { error } = await supabase
        .from("site_settings")
        .upsert({ key: "general", value: input, updated_at: new Date().toISOString() });
      if (error) throw error;
    },
    onSuccess: async () => {
      toast.success("Arayüz ayarları güncellendi");
      await qc.invalidateQueries();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold">Arayüz ayarları</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Site adı, duyuru şeridi ve anasayfa metinleri.
      </p>

      <div className="mt-8 space-y-5 rounded-xl border border-border bg-card p-6 shadow-card">
        <div className="space-y-2">
          <Label>Site adı</Label>
          <Input
            value={form.siteName}
            onChange={(e) => setForm({ ...form, siteName: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label>Slogan</Label>
          <Input
            value={form.tagline}
            onChange={(e) => setForm({ ...form, tagline: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label>Anasayfa başlığı</Label>
          <Input
            value={form.heroTitle}
            onChange={(e) => setForm({ ...form, heroTitle: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label>Anasayfa alt metni</Label>
          <Textarea
            rows={3}
            value={form.heroSubtitle}
            onChange={(e) => setForm({ ...form, heroSubtitle: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label>Duyuru metni</Label>
          <Input
            value={form.announcement}
            onChange={(e) => setForm({ ...form, announcement: e.target.value })}
          />
        </div>
        <div className="flex items-center justify-between rounded-lg border border-border p-3">
          <Label>Duyuru şeridini göster</Label>
          <Switch
            checked={form.showAnnouncement}
            onCheckedChange={(v) => setForm({ ...form, showAnnouncement: v })}
          />
        </div>
        <div className="space-y-2">
          <Label>İletişim e-postası</Label>
          <Input
            value={form.contactEmail}
            onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
          />
        </div>
        <Button disabled={save.isPending} onClick={() => save.mutate(form)}>
          Kaydet
        </Button>
      </div>

      <div className="mt-8 space-y-5 rounded-xl border border-border bg-card p-6 shadow-card">
        <div>
          <h2 className="text-lg font-semibold">Anasayfa bölüm başlıkları</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Anasayfadaki bölümlerin başlık ve açıklamalarını buradan düzenleyin.
          </p>
        </div>

        <div className="space-y-2">
          <Label>Haberler bölümü başlığı</Label>
          <Input
            value={form.newsTitle}
            onChange={(e) => setForm({ ...form, newsTitle: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label>Haberler bölümü açıklaması</Label>
          <Input
            value={form.newsSubtitle}
            onChange={(e) => setForm({ ...form, newsSubtitle: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label>Dış yazılar bölümü başlığı</Label>
          <Input
            value={form.externalTitle}
            onChange={(e) => setForm({ ...form, externalTitle: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label>Dış yazılar bölümü açıklaması</Label>
          <Input
            value={form.externalSubtitle}
            onChange={(e) => setForm({ ...form, externalSubtitle: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label>“Tümünü Gör” bağlantısı</Label>
          <Input
            placeholder="https://ornek.com/yazilar (boş bırakılırsa site içi /dis-yazilar sayfası açılır)"
            value={form.externalAllUrl}
            onChange={(e) => setForm({ ...form, externalAllUrl: e.target.value })}
          />
          <p className="text-xs text-muted-foreground">
            Boş bırakırsanız buton, admin panelinden eklediğiniz tüm dış yazıları listeleyen
            site içi sayfaya gider.
          </p>
        </div>

        <div className="space-y-2">
          <Label>Etkinlikler bölümü başlığı</Label>
          <Input
            value={form.eventsTitle}
            onChange={(e) => setForm({ ...form, eventsTitle: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label>Etkinlikler bölümü açıklaması</Label>
          <Input
            value={form.eventsSubtitle}
            onChange={(e) => setForm({ ...form, eventsSubtitle: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label>Dernekler/yayınlar bölümü başlığı</Label>
          <Input
            value={form.linksTitle}
            onChange={(e) => setForm({ ...form, linksTitle: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label>Dernekler/yayınlar bölümü açıklaması</Label>
          <Input
            value={form.linksSubtitle}
            onChange={(e) => setForm({ ...form, linksSubtitle: e.target.value })}
          />
        </div>

        <Button disabled={save.isPending} onClick={() => save.mutate(form)}>
          Kaydet
        </Button>
      </div>
    </div>
  );
}
