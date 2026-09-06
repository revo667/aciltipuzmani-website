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
import { categoriesQuery, formatDate, slugify, tagsQuery, type Post } from "@/lib/content";
import { createCategory, createTag, savePostTaxonomy } from "@/lib/taxonomy";

export const Route = createFileRoute("/admin/yazilar")({
  component: AdminPosts,
});

type Draft = {
  id?: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  cover_url: string;
  category: string;
  status: string;
  categoryIds: string[];
  tagIds: string[];
};

const emptyDraft: Draft = {
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  cover_url: "",
  category: "haber",
  status: "draft",
  categoryIds: [],
  tagIds: [],
};

function AdminPosts() {
  const qc = useQueryClient();
  const [draft, setDraft] = useState<Draft | null>(null);

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["admin", "posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Post[];
    },
  });

  const { data: categories = [] } = useQuery(categoriesQuery());
  const { data: tags = [] } = useQuery(tagsQuery());

  const { data: categoryLinks = [] } = useQuery({
    queryKey: ["admin", "post_categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("post_categories").select("post_id,category_id");
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: tagLinks = [] } = useQuery({
    queryKey: ["admin", "post_tags"],
    queryFn: async () => {
      const { data, error } = await supabase.from("post_tags").select("post_id,tag_id");
      if (error) throw error;
      return data ?? [];
    },
  });

  const categoryIdsOf = (postId: string) =>
    categoryLinks.filter((r) => r.post_id === postId).map((r) => r.category_id);
  const tagIdsOf = (postId: string) =>
    tagLinks.filter((r) => r.post_id === postId).map((r) => r.tag_id);
  const nameOf = (list: { id: string; name: string }[], ids: string[]) =>
    list.filter((item) => ids.includes(item.id)).map((item) => item.name);

  const save = useMutation({
    mutationFn: async (input: Draft) => {
      // Kategori listesindeki ilki eski `category` sutununu da guncel tutar.
      const primary = categories.find((c) => c.id === input.categoryIds[0]);
      const payload = {
        title: input.title,
        slug: input.slug || slugify(input.title),
        excerpt: input.excerpt || null,
        content: input.content,
        cover_url: input.cover_url || null,
        category: primary?.slug ?? input.category,
        status: input.status,
        published_at: input.status === "published" ? new Date().toISOString() : null,
      };
      let postId = input.id;
      if (postId) {
        const { error } = await supabase.from("posts").update(payload).eq("id", postId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from("posts").insert(payload).select("id").single();
        if (error) throw error;
        postId = data.id;
      }
      await savePostTaxonomy(postId, input.categoryIds, input.tagIds);
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
      const { error } = await supabase.from("posts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: async () => {
      toast.success("Silindi");
      await qc.invalidateQueries();
    },
    onError: (e: Error) => toast.error(e.message),
  });

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

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Yazılar</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Haber ve rehber içeriklerini yönetin.
          </p>
        </div>
        <Button onClick={() => setDraft({ ...emptyDraft })}>
          <Plus className="mr-1 size-4" /> Yeni yazı
        </Button>
      </div>

      <div className="mt-8 space-y-3">
        {isLoading ? <p className="text-sm text-muted-foreground">Yükleniyor…</p> : null}
        {posts.map((post) => {
          const postCategories = nameOf(categories, categoryIdsOf(post.id));
          const postTags = nameOf(tags, tagIdsOf(post.id));
          return (
            <div
              key={post.id}
              className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-card sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="truncate font-medium">{post.title}</h2>
                  <Badge variant={post.status === "published" ? "default" : "secondary"}>
                    {post.status === "published" ? "Yayında" : "Taslak"}
                  </Badge>
                  {(postCategories.length > 0 ? postCategories : [post.category]).map((name) => (
                    <Badge key={name} variant="outline" className="capitalize">
                      {name}
                    </Badge>
                  ))}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatDate(post.published_at ?? post.created_at)} · /{post.slug}
                  {postTags.length > 0 ? ` · #${postTags.join(" #")}` : ""}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setDraft({
                      id: post.id,
                      title: post.title,
                      slug: post.slug,
                      excerpt: post.excerpt ?? "",
                      content: post.content,
                      cover_url: post.cover_url ?? "",
                      category: post.category,
                      status: post.status,
                      categoryIds: categoryIdsOf(post.id),
                      tagIds: tagIdsOf(post.id),
                    })
                  }
                >
                  <Pencil className="size-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    if (confirm("Bu yazı silinsin mi?")) remove.mutate(post.id);
                  }}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      <Dialog open={draft !== null} onOpenChange={(open) => !open && setDraft(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{draft?.id ? "Yazıyı düzenle" : "Yeni yazı"}</DialogTitle>
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
                  <Label>Kısa yol (slug)</Label>
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
                      <SelectItem value="draft">Taslak</SelectItem>
                      <SelectItem value="published">Yayında</SelectItem>
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
                <Label>Kapak görseli (URL)</Label>
                <Input
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
                  rows={10}
                  value={draft.content}
                  onChange={(e) => setDraft({ ...draft, content: e.target.value })}
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
