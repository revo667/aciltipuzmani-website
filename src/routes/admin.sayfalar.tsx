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
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TaxonomyPicker } from "@/components/admin/TaxonomyPicker";
import { categoriesQuery, slugify, tagsQuery, type PageItem } from "@/lib/content";
import { createCategory, createTag, savePageTaxonomy } from "@/lib/taxonomy";

export const Route = createFileRoute("/admin/sayfalar")({
  component: AdminPages,
});

type Draft = {
  id?: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  cover_url: string;
  status: string;
  sort_order: number;
  categoryIds: string[];
  tagIds: string[];
};

const emptyDraft: Draft = {
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  cover_url: "",
  status: "published",
  sort_order: 0,
  categoryIds: [],
  tagIds: [],
};

function AdminPages() {
  const qc = useQueryClient();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [uploading, setUploading] = useState(false);

  async function uploadCover(file: File) {
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `pages/${crypto.randomUUID()}.${ext}`;
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

  const { data: pages = [] } = useQuery({
    queryKey: ["admin", "pages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pages")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as PageItem[];
    },
  });

  const { data: categories = [] } = useQuery(categoriesQuery());
  const { data: tags = [] } = useQuery(tagsQuery());

  const { data: categoryLinks = [] } = useQuery({
    queryKey: ["admin", "page_categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("page_categories").select("page_id,category_id");
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: tagLinks = [] } = useQuery({
    queryKey: ["admin", "page_tags"],
    queryFn: async () => {
      const { data, error } = await supabase.from("page_tags").select("page_id,tag_id");
      if (error) throw error;
      return data ?? [];
    },
  });

  const categoryIdsOf = (pageId: string) =>
    categoryLinks.filter((r) => r.page_id === pageId).map((r) => r.category_id);
  const tagIdsOf = (pageId: string) =>
    tagLinks.filter((r) => r.page_id === pageId).map((r) => r.tag_id);

  const addCategory = useMutation({
    mutationFn: createCategory,
    onSuccess: async (category) => {
      setDraft((d) =>
        d && !d.categoryIds.includes(category.id)
          ? { ...d, categoryIds: [...d.categoryIds, category.id] }
          : d,
      );
      await qc.invalidateQueries({ queryKey: ["categories"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const addTag = useMutation({
    mutationFn: createTag,
    onSuccess: async (tag) => {
      setDraft((d) =>
        d && !d.tagIds.includes(tag.id) ? { ...d, tagIds: [...d.tagIds, tag.id] } : d,
      );
      await qc.invalidateQueries({ queryKey: ["tags"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const save = useMutation({
    mutationFn: async (input: Draft) => {
      const payload = {
        title: input.title,
        slug: input.slug || slugify(input.title),
        excerpt: input.excerpt || null,
        content: input.content,
        cover_url: input.cover_url || null,
        status: input.status,
        sort_order: Number(input.sort_order) || 0,
      };
      let pageId = input.id;
      if (pageId) {
        const { error } = await supabase.from("pages").update(payload).eq("id", pageId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from("pages").insert(payload).select("id").single();
        if (error) throw error;
        pageId = data.id;
      }
      await savePageTaxonomy(pageId, input.categoryIds, input.tagIds);
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
      const { error } = await supabase.from("pages").delete().eq("id", id);
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
          <h1 className="text-2xl font-semibold">Sayfalar</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Hakkımızda, İletişim gibi serbest sayfalar. Adres: /sayfa/adres
          </p>
        </div>
        <Button onClick={() => setDraft({ ...emptyDraft })}>
          <Plus className="mr-1 size-4" /> Yeni sayfa
        </Button>
      </div>

      <div className="mt-8 space-y-3">
        {pages.map((page) => (
          <div
            key={page.id}
            className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-4 shadow-card"
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="truncate font-medium">{page.title}</h2>
                <Badge variant={page.status === "published" ? "default" : "secondary"}>
                  {page.status === "published" ? "Yayında" : "Taslak"}
                </Badge>
              </div>
              <p className="mt-1 truncate text-xs text-muted-foreground">/sayfa/{page.slug}</p>
            </div>
            <div className="flex shrink-0 gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  setDraft({
                    id: page.id,
                    title: page.title,
                    slug: page.slug,
                    excerpt: page.excerpt ?? "",
                    content: page.content,
                    cover_url: page.cover_url ?? "",
                    status: page.status,
                    sort_order: page.sort_order,
                    categoryIds: categoryIdsOf(page.id),
                    tagIds: tagIdsOf(page.id),
                  })
                }
              >
                <Pencil className="size-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  if (confirm("Silinsin mi?")) remove.mutate(page.id);
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
            <DialogTitle>{draft?.id ? "Sayfayı düzenle" : "Yeni sayfa"}</DialogTitle>
          </DialogHeader>
          {draft ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Başlık</Label>
                <Input
                  value={draft.title}
                  onChange={(e) => {
                    const title = e.target.value;
                    setDraft({
                      ...draft,
                      title,
                      slug: draft.id ? draft.slug : slugify(title),
                    });
                  }}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Adres (slug)</Label>
                  <Input
                    value={draft.slug}
                    onChange={(e) => setDraft({ ...draft, slug: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Durum</Label>
                  <Select
                    value={draft.status}
                    onValueChange={(v) => setDraft({ ...draft, status: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="published">Yayında</SelectItem>
                      <SelectItem value="draft">Taslak</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <TaxonomyPicker
                label="Kategoriler"
                items={categories}
                selected={draft.categoryIds}
                onChange={(ids) => setDraft({ ...draft, categoryIds: ids })}
                onCreate={(name) => addCategory.mutate(name)}
                creating={addCategory.isPending}
                placeholder="Yeni kategori adı"
              />

              <TaxonomyPicker
                label="Etiketler"
                items={tags}
                selected={draft.tagIds}
                onChange={(ids) => setDraft({ ...draft, tagIds: ids })}
                onCreate={(name) => addTag.mutate(name)}
                creating={addTag.isPending}
                placeholder="Yeni etiket adı"
              />

              <div className="space-y-2">
                <Label>Kapak görseli</Label>
                {draft.cover_url ? (
                  <img
                    src={draft.cover_url}
                    alt="Kapak önizleme"
                    className="h-32 w-auto rounded-lg border border-border object-cover"
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
                <Label>Özet</Label>
                <Textarea
                  rows={2}
                  value={draft.excerpt}
                  onChange={(e) => setDraft({ ...draft, excerpt: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>İçerik</Label>
                <Textarea
                  rows={12}
                  value={draft.content}
                  onChange={(e) => setDraft({ ...draft, content: e.target.value })}
                />
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
