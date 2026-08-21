import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ExternalArticle } from "@/lib/content";

export const Route = createFileRoute("/admin/dislinkler")({
  component: AdminExternalArticles,
});

type Draft = {
  id?: string;
  title: string;
  url: string;
  source_name: string;
  cover_url: string;
  tags: string;
  status: "published" | "draft";
  sort_order: number;
};

const emptyDraft: Draft = {
  title: "",
  url: "",
  source_name: "",
  cover_url: "",
  tags: "",
  status: "published",
  sort_order: 0,
};

function AdminExternalArticles() {
  const qc = useQueryClient();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [uploading, setUploading] = useState(false);

  async function uploadCover(file: File) {
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() ?? "png";
      const path = `external_articles/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("media").upload(path, file, {
        cacheControl: "31536000",
        upsert: false,
      });
      if (error) throw error;
      const { data, error: signErr } = await supabase.storage
        .from("media")
        .createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
      if (signErr) throw signErr;
      setDraft((d) => (d ? { ...d, cover_url: data.signedUrl } : d));
      toast.success("Kapak görseli yüklendi");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setUploading(false);
    }
  }

  const { data: articles = [] } = useQuery({
    queryKey: ["admin", "external_articles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("external_articles")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as ExternalArticle[];
    },
  });

  const save = useMutation({
    mutationFn: async (input: Draft) => {
      const payload = {
        title: input.title,
        url: input.url,
        source_name: input.source_name,
        cover_url: input.cover_url || null,
        tags: input.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        status: input.status,
        sort_order: Number(input.sort_order) || 0,
      };
      if (input.id) {
        const { error } = await supabase.from("external_articles").update(payload).eq("id", input.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("external_articles").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: async () => {
      toast.success("Kaydedildi");
      setDraft(null);
      await qc.invalidateQueries();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("external_articles").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: async () => {
      toast.success("Silindi");
      await qc.invalidateQueries();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Dış Linkler</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Anasayfadaki "Acil Tıp Web Sitelerinden" bandınındaki harici makaleler.
          </p>
        </div>
        <Button onClick={() => setDraft({ ...emptyDraft })}>
          <Plus className="mr-1 size-4" /> Yeni ekle
        </Button>
      </div>

      <div className="mt-8 space-y-3">
        {articles.map((article) => (
          <div
            key={article.id}
            className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-4 shadow-card"
          >
            <div className="flex min-w-0 items-center gap-3">
              {article.cover_url ? (
                <img
                  src={article.cover_url}
                  alt={article.title}
                  className="size-12 shrink-0 rounded-lg border border-border bg-white object-cover"
                />
              ) : null}
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="truncate font-medium">{article.title}</h2>
                  <Badge variant={article.status === "published" ? "default" : "secondary"}>
                    {article.status === "published" ? "Yayında" : "Taslak"}
                  </Badge>
                </div>
                <p className="mt-1 truncate text-xs text-muted-foreground">
                  {article.source_name} — {article.url}
                </p>
                {article.tags.length > 0 ? (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {article.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-[10px]">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
            <div className="flex shrink-0 gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  setDraft({
                    id: article.id,
                    title: article.title,
                    url: article.url,
                    source_name: article.source_name,
                    cover_url: article.cover_url ?? "",
                    tags: article.tags.join(", "),
                    status: article.status as "published" | "draft",
                    sort_order: article.sort_order,
                  })
                }
              >
                <Pencil className="size-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  if (confirm("Silinsin mi?")) remove.mutate(article.id);
                }}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={draft !== null} onOpenChange={(open) => !open && setDraft(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{draft?.id ? "Dış bağlantıyı düzenle" : "Yeni dış bağlantı"}</DialogTitle>
          </DialogHeader>
          {draft ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Başlık</Label>
                <Input
                  value={draft.title}
                  onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Kaynak site adı</Label>
                  <Input
                    value={draft.source_name}
                    onChange={(e) => setDraft({ ...draft, source_name: e.target.value })}
                    placeholder="örn. Acilci.net"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Sıra</Label>
                  <Input
                    type="number"
                    value={draft.sort_order}
                    onChange={(e) => setDraft({ ...draft, sort_order: Number(e.target.value) || 0 })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>URL</Label>
                <Input
                  value={draft.url}
                  onChange={(e) => setDraft({ ...draft, url: e.target.value })}
                  placeholder="https://..."
                />
              </div>
              <div className="space-y-2">
                <Label>Etiketler (virgülle ayırın)</Label>
                <Input
                  value={draft.tags}
                  onChange={(e) => setDraft({ ...draft, tags: e.target.value })}
                  placeholder="Acil Tıp Sitelerinden, Kardiyoloji..."
                />
              </div>
              <div className="space-y-2">
                <Label>Kapak görseli</Label>
                {draft.cover_url ? (
                  <div className="flex items-center gap-3">
                    <img
                      src={draft.cover_url}
                      alt=""
                      className="size-16 rounded-lg border border-border object-cover"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDraft({ ...draft, cover_url: "" })}
                    >
                      Kaldır
                    </Button>
                  </div>
                ) : (
                  <Input
                    type="file"
                    accept="image/*"
                    disabled={uploading}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) void uploadCover(file);
                    }}
                  />
                )}
              </div>
              <div className="space-y-2">
                <Label>Durum</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={draft.status === "published" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setDraft({ ...draft, status: "published" })}
                  >
                    Yayında
                  </Button>
                  <Button
                    type="button"
                    variant={draft.status === "draft" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setDraft({ ...draft, status: "draft" })}
                  >
                    Taslak
                  </Button>
                </div>
              </div>
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDraft(null)}>
              İptal
            </Button>
            <Button
              onClick={() => draft && save.mutate(draft)}
              disabled={save.isPending || !draft?.title || !draft?.url || !draft?.source_name}
            >
              Kaydet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
