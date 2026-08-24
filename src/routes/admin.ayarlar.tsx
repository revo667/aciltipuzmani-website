import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Download, Loader2, Wrench } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { defaultSettings, settingsQuery, type GeneralSettings } from "@/lib/content";
import { buildBackup, type BackupProgress, type BackupScope } from "@/lib/backup";

export const Route = createFileRoute("/admin/ayarlar")({
  component: AdminSettings,
});

const scopeLabels: { key: keyof BackupScope; label: string; hint: string }[] = [
  { key: "publishedPosts", label: "Yayındaki yazılar", hint: "status = published" },
  { key: "draftPosts", label: "Taslaklar", hint: "henüz yayınlanmamış yazılar" },
  { key: "pages", label: "Sayfalar", hint: "İletişim, Gizlilik gibi statik sayfalar" },
  { key: "data", label: "Etkinlik, bağlantı ve ayarlar", hint: "JSON olarak" },
  { key: "images", label: "Görseller", hint: "images/ klasörüne, orijinal yapısıyla" },
];

function AdminSettings() {
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
      toast.success("Ayarlar kaydedildi");
      await qc.invalidateQueries();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const [scope, setScope] = useState<BackupScope>({
    publishedPosts: true,
    draftPosts: true,
    pages: true,
    data: true,
    images: true,
  });
  const [progress, setProgress] = useState<BackupProgress | null>(null);

  async function runBackup() {
    setProgress({ step: "Başlıyor", done: 0, total: 1 });
    try {
      const { blob, fileName, summary } = await buildBackup(scope, setProgress);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success(`Yedek hazır: ${summary.join(", ")}`);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setProgress(null);
    }
  }

  const busy = progress !== null;

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold">Ayarlar</h1>
      <p className="mt-1 text-sm text-muted-foreground">Bakım modu ve site yedeği.</p>

      <section className="mt-8 space-y-5 rounded-xl border border-border bg-card p-6 shadow-card">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
            <Wrench className="size-4" />
          </span>
          <div>
            <h2 className="font-semibold">Bakım modu</h2>
            <p className="text-sm text-muted-foreground">
              Açıkken siteyi yalnızca yöneticiler görür. Yönetim paneli ve giriş sayfası açık kalır.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-lg border border-border p-3">
          <Label htmlFor="maintenance">Bakım modunu aç</Label>
          <Switch
            id="maintenance"
            checked={form.maintenanceMode}
            onCheckedChange={(v) => setForm({ ...form, maintenanceMode: v })}
          />
        </div>

        <div className="space-y-2">
          <Label>Bakım sayfası başlığı</Label>
          <Input
            value={form.maintenanceTitle}
            onChange={(e) => setForm({ ...form, maintenanceTitle: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label>Bakım sayfası metni</Label>
          <Textarea
            rows={3}
            value={form.maintenanceMessage}
            onChange={(e) => setForm({ ...form, maintenanceMessage: e.target.value })}
          />
        </div>

        <Button onClick={() => save.mutate(form)} disabled={save.isPending}>
          {save.isPending ? "Kaydediliyor…" : "Kaydet"}
        </Button>
      </section>

      <section className="mt-6 space-y-5 rounded-xl border border-border bg-card p-6 shadow-card">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
            <Download className="size-4" />
          </span>
          <div>
            <h2 className="font-semibold">Site yedeği</h2>
            <p className="text-sm text-muted-foreground">
              Yazılar markdown olarak <code className="text-xs">&lt;slug&gt;,&lt;tarih&gt;.md</code>{" "}
              adıyla, görseller <code className="text-xs">images/</code> klasörüne konur ve tek bir
              zip olarak iner.
            </p>
          </div>
        </div>

        <div className="space-y-2">
          {scopeLabels.map((s) => (
            <label
              key={s.key}
              className="flex cursor-pointer items-center gap-3 rounded-lg border border-border p-3"
            >
              <Checkbox
                checked={scope[s.key]}
                onCheckedChange={(v) => setScope({ ...scope, [s.key]: v === true })}
              />
              <span className="flex-1">
                <span className="text-sm font-medium">{s.label}</span>
                <span className="block text-xs text-muted-foreground">{s.hint}</span>
              </span>
            </label>
          ))}
        </div>

        {progress ? (
          <div className="rounded-lg border border-border bg-muted/50 p-3 text-sm">
            <div className="flex items-center gap-2">
              <Loader2 className="size-4 animate-spin" />
              <span>{progress.step}</span>
              {progress.total > 1 ? (
                <span className="ml-auto tabular-nums text-muted-foreground">
                  {progress.done} / {progress.total}
                </span>
              ) : null}
            </div>
            {progress.total > 1 ? (
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-border">
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: `${Math.round((progress.done / progress.total) * 100)}%` }}
                />
              </div>
            ) : null}
          </div>
        ) : null}

        <Button onClick={runBackup} disabled={busy}>
          {busy ? "Hazırlanıyor…" : "Yedeği indir"}
        </Button>
        <p className="text-xs text-muted-foreground">
          Yedek tarayıcında oluşturulur. Görseller dahil edildiğinde birkaç dakika sürebilir;
          sekmeyi kapatma.
        </p>
      </section>
    </div>
  );
}
