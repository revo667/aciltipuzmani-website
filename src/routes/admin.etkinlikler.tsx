import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatDateTime, slugify, type EventItem } from "@/lib/content";

export const Route = createFileRoute("/admin/etkinlikler")({
  component: AdminEvents,
});

type Draft = {
  id?: string;
  title: string;
  slug: string;
  description: string;
  location: string;
  city: string;
  starts_at: string;
  ends_at: string;
  registration_url: string;
  cover_url: string;
  featured: boolean;
  status: string;
};

const emptyDraft: Draft = {
  title: "",
  slug: "",
  description: "",
  location: "",
  city: "",
  starts_at: "",
  ends_at: "",
  registration_url: "",
  cover_url: "",
  featured: false,
  status: "published",
};

function toLocalInput(value: string | null) {
  if (!value) return "";
  const d = new Date(value);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function AdminEvents() {
  const qc = useQueryClient();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [uploading, setUploading] = useState(false);

  async function uploadCover(file: File) {
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `events/${crypto.randomUUID()}.${ext}`;
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
      toast.success("Görsel yüklendi");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setUploading(false);
    }
  }

  const { data: events = [] } = useQuery({
    queryKey: ["admin", "events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .order("starts_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as EventItem[];
    },
  });

  const save = useMutation({
    mutationFn: async (input: Draft) => {
      if (!input.starts_at) throw new Error("Başlangıç tarihi gerekli");
      const payload = {
        title: input.title,
        slug: input.slug || slugify(input.title),
        description: input.description || null,
        location: input.location || null,
        city: input.city || null,
        starts_at: new Date(input.starts_at).toISOString(),
        ends_at: input.ends_at ? new Date(input.ends_at).toISOString() : null,
        registration_url: input.registration_url || null,
        cover_url: input.cover_url || null,
        featured: input.featured,
        status: input.status,
      };
      if (input.id) {
        const { error } = await supabase.from("events").update(payload).eq("id", input.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("events").insert(payload);
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
      const { error } = await supabase.from("events").delete().eq("id", id);
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
          <h1 className="text-2xl font-semibold">Etkinlikler</h1>
          <p className="mt-1 text-sm text-muted-foreground">Kongre, kurs ve sempozyum takvimi.</p>
        </div>
        <Button onClick={() => setDraft({ ...emptyDraft })}>
          <Plus className="mr-1 size-4" /> Yeni etkinlik
        </Button>
      </div>

      <div className="mt-8 space-y-3">
        {events.map((ev) => (
          <div
            key={ev.id}
            className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-card sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex min-w-0 gap-3">
              {ev.cover_url ? (
                <img
                  src={ev.cover_url}
                  alt={ev.title}
                  className="size-16 shrink-0 rounded-lg border border-border object-cover"
                />
              ) : null}
              <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="truncate font-medium">{ev.title}</h2>
                {ev.featured ? <Badge>Öne çıkan</Badge> : null}
                <Badge variant={ev.status === "published" ? "default" : "secondary"}>
                  {ev.status === "published" ? "Yayında" : "Taslak"}
                </Badge>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {formatDateTime(ev.starts_at)} · {[ev.location, ev.city].filter(Boolean).join(", ")}
              </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  setDraft({
                    id: ev.id,
                    title: ev.title,
                    slug: ev.slug,
                    description: ev.description ?? "",
                    location: ev.location ?? "",
                    city: ev.city ?? "",
                    starts_at: toLocalInput(ev.starts_at),
                    ends_at: toLocalInput(ev.ends_at),
                    registration_url: ev.registration_url ?? "",
                    cover_url: ev.cover_url ?? "",
                    featured: ev.featured,
                    status: ev.status,
                  })
                }
              >
                <Pencil className="size-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  if (confirm("Bu etkinlik silinsin mi?")) remove.mutate(ev.id);
                }}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={draft !== null} onOpenChange={(open) => !open && setDraft(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{draft?.id ? "Etkinliği düzenle" : "Yeni etkinlik"}</DialogTitle>
          </DialogHeader>
          {draft ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Başlık</Label>
                <Input
                  value={draft.title}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      title: e.target.value,
                      slug: draft.id ? draft.slug : slugify(e.target.value),
                    })
                  }
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Başlangıç</Label>
                  <Input
                    type="datetime-local"
                    value={draft.starts_at}
                    onChange={(e) => setDraft({ ...draft, starts_at: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Bitiş</Label>
                  <Input
                    type="datetime-local"
                    value={draft.ends_at}
                    onChange={(e) => setDraft({ ...draft, ends_at: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Mekân</Label>
                  <Input
                    value={draft.location}
                    onChange={(e) => setDraft({ ...draft, location: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Şehir</Label>
                  <Input
                    value={draft.city}
                    onChange={(e) => setDraft({ ...draft, city: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Kayıt bağlantısı</Label>
                <Input
                  value={draft.registration_url}
                  onChange={(e) => setDraft({ ...draft, registration_url: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Afiş / görsel</Label>
                {draft.cover_url ? (
                  <img
                    src={draft.cover_url}
                    alt="Afiş önizleme"
                    className="h-40 w-auto rounded-lg border border-border object-contain"
                  />
                ) : null}
                <Input
                  type="file"
                  accept="image/*"
                  disabled={uploading}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void uploadCover(file);
                  }}
                />
                <Input
                  placeholder="veya görsel bağlantısı (https://...)"
                  value={draft.cover_url}
                  onChange={(e) => setDraft({ ...draft, cover_url: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Açıklama</Label>
                <Textarea
                  rows={4}
                  value={draft.description}
                  onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <Label>Öne çıkar</Label>
                <Switch
                  checked={draft.featured}
                  onCheckedChange={(v) => setDraft({ ...draft, featured: v })}
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <Label>Yayında</Label>
                <Switch
                  checked={draft.status === "published"}
                  onCheckedChange={(v) => setDraft({ ...draft, status: v ? "published" : "draft" })}
                />
              </div>
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDraft(null)}>
              Vazgeç
            </Button>
            <Button
              disabled={save.isPending || !draft?.title}
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
