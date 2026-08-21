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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { LinkItem } from "@/lib/content";

export const Route = createFileRoute("/admin/baglantilar")({
  component: AdminLinks,
});

type Draft = {
  id?: string;
  name: string;
  url: string;
  logo_url: string;
  kind: string;
  sort_order: number;
};

const emptyDraft: Draft = { name: "", url: "", logo_url: "", kind: "dernek", sort_order: 0 };

const kindLabels: Record<string, string> = {
  yayin: "Dernek Yayını (Dergi)",
  dernek: "Acil Tıp Derneği",
  klinik: "Acil Tıp Kliniği Web Sitesi",
  kaynak: "Acil Tıp Web Sitesi",
};


function AdminLinks() {
  const qc = useQueryClient();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [uploading, setUploading] = useState(false);

  async function uploadLogo(file: File) {
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() ?? "png";
      const path = `links/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("media").upload(path, file, {
        cacheControl: "31536000",
        upsert: false,
      });
      if (error) throw error;
      const { data, error: signErr } = await supabase.storage
        .from("media")
        .createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
      if (signErr) throw signErr;
      setDraft((d) => (d ? { ...d, logo_url: data.signedUrl } : d));
      toast.success("Logo yüklendi");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setUploading(false);
    }
  }

  const { data: links = [] } = useQuery({
    queryKey: ["admin", "links"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("links")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as LinkItem[];
    },
  });

  const save = useMutation({
    mutationFn: async (input: Draft) => {
      const payload = {
        name: input.name,
        url: input.url,
        logo_url: input.logo_url || null,
        kind: input.kind,
        sort_order: Number(input.sort_order) || 0,
      };
      if (input.id) {
        const { error } = await supabase.from("links").update(payload).eq("id", input.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("links").insert(payload);
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
      const { error } = await supabase.from("links").delete().eq("id", id);
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
          <h1 className="text-2xl font-semibold">Dernek & Yayın bağlantıları</h1>
          <p className="mt-1 text-sm text-muted-foreground">Kaynaklar sayfasında listelenir.</p>
        </div>
        <Button onClick={() => setDraft({ ...emptyDraft })}>
          <Plus className="mr-1 size-4" /> Yeni bağlantı
        </Button>
      </div>

      <div className="mt-8 space-y-3">
        {links.map((link) => (
          <div
            key={link.id}
            className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-4 shadow-card"
          >
            <div className="flex min-w-0 items-center gap-3">
              {link.logo_url ? (
                <img
                  src={link.logo_url}
                  alt={link.name}
                  className="size-12 shrink-0 rounded-lg border border-border bg-white object-contain p-1"
                />
              ) : null}
              <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="truncate font-medium">{link.name}</h2>
                <Badge variant="outline">{kindLabels[link.kind] ?? link.kind}</Badge>
              </div>
              <p className="mt-1 truncate text-xs text-muted-foreground">{link.url}</p>
              </div>
            </div>
            <div className="flex shrink-0 gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  setDraft({
                    id: link.id,
                    name: link.name,
                    url: link.url,
                    logo_url: link.logo_url ?? "",
                    kind: link.kind,
                    sort_order: link.sort_order,
                  })
                }
              >
                <Pencil className="size-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  if (confirm("Silinsin mi?")) remove.mutate(link.id);
                }}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={draft !== null} onOpenChange={(open) => !open && setDraft(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{draft?.id ? "Bağlantıyı düzenle" : "Yeni bağlantı"}</DialogTitle>
          </DialogHeader>
          {draft ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Ad</Label>
                <Input
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Bağlantı</Label>
                <Input
                  value={draft.url}
                  onChange={(e) => setDraft({ ...draft, url: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Logo</Label>
                {draft.logo_url ? (
                  <img
                    src={draft.logo_url}
                    alt="Logo önizleme"
                    className="h-20 w-auto rounded-lg border border-border bg-white object-contain p-2"
                  />
                ) : null}
                <Input
                  type="file"
                  accept="image/*"
                  disabled={uploading}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void uploadLogo(file);
                  }}
                />
                <Input
                  placeholder="veya logo bağlantısı (https://...)"
                  value={draft.logo_url}
                  onChange={(e) => setDraft({ ...draft, logo_url: e.target.value })}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Tür</Label>
                  <Select value={draft.kind} onValueChange={(v) => setDraft({ ...draft, kind: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yayin">Dernek Yayını (Dergi)</SelectItem>
                      <SelectItem value="dernek">Acil Tıp Derneği</SelectItem>
                      <SelectItem value="klinik">Acil Tıp Kliniği Web Sitesi</SelectItem>
                      <SelectItem value="kaynak">Acil Tıp Web Sitesi</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Sıra</Label>
                  <Input
                    type="number"
                    value={draft.sort_order}
                    onChange={(e) => setDraft({ ...draft, sort_order: Number(e.target.value) })}
                  />
                </div>
              </div>
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDraft(null)}>
              Vazgeç
            </Button>
            <Button
              disabled={save.isPending || !draft?.name || !draft?.url}
              onClick={() => draft && save.mutate(draft)}
            >
              Kaydet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
