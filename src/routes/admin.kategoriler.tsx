import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check, Pencil, Plus, Trash2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { categoriesQuery, slugify, tagsQuery, type Category, type Tag } from "@/lib/content";

export const Route = createFileRoute("/admin/kategoriler")({
  component: AdminTaxonomies,
});

type CategoryDraft = { name: string; slug: string; description: string; sort_order: number };
type TagDraft = { name: string; slug: string };

const emptyCategory: CategoryDraft = { name: "", slug: "", description: "", sort_order: 0 };
const emptyTag: TagDraft = { name: "", slug: "" };

function AdminTaxonomies() {
  const qc = useQueryClient();
  const { data: categories = [] } = useQuery(categoriesQuery());
  const { data: tags = [] } = useQuery(tagsQuery());

  const [categoryDraft, setCategoryDraft] = useState<CategoryDraft>({ ...emptyCategory });
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [tagDraft, setTagDraft] = useState<TagDraft>({ ...emptyTag });
  const [editingTag, setEditingTag] = useState<string | null>(null);

  const invalidate = async () => {
    await qc.invalidateQueries();
  };

  const saveCategory = useMutation({
    mutationFn: async ({ id, draft }: { id: string | null; draft: CategoryDraft }) => {
      const payload = {
        name: draft.name.trim(),
        slug: (draft.slug || slugify(draft.name)).trim(),
        description: draft.description.trim() || null,
        sort_order: Number(draft.sort_order) || 0,
      };
      if (id) {
        const { error } = await supabase.from("categories").update(payload).eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("categories").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: async () => {
      toast.success("Kategori kaydedildi");
      setCategoryDraft({ ...emptyCategory });
      setEditingCategory(null);
      await invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeCategory = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: async () => {
      toast.success("Kategori silindi");
      await invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const saveTag = useMutation({
    mutationFn: async ({ id, draft }: { id: string | null; draft: TagDraft }) => {
      const payload = {
        name: draft.name.trim(),
        slug: (draft.slug || slugify(draft.name)).trim(),
      };
      if (id) {
        const { error } = await supabase.from("tags").update(payload).eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("tags").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: async () => {
      toast.success("Etiket kaydedildi");
      setTagDraft({ ...emptyTag });
      setEditingTag(null);
      await invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeTag = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tags").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: async () => {
      toast.success("Etiket silindi");
      await invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const startEditCategory = (item: Category) => {
    setEditingCategory(item.id);
    setCategoryDraft({
      name: item.name,
      slug: item.slug,
      description: item.description ?? "",
      sort_order: item.sort_order,
    });
  };

  const startEditTag = (item: Tag) => {
    setEditingTag(item.id);
    setTagDraft({ name: item.name, slug: item.slug });
  };

  return (
    <div>
      <div>
        <h1 className="text-2xl font-semibold">Kategori & Etiket</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Burada tanımladığınız kategori ve etiketler, yazı ve sayfa ekleme ekranlarında seçilebilir
          hale gelir.
        </p>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        {/* Kategoriler */}
        <section className="rounded-xl border border-border bg-card p-5 shadow-card">
          <h2 className="text-lg font-semibold">Kategoriler</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Yazı ve sayfaların ana başlık altında gruplanmasını sağlar.
          </p>

          <div className="mt-4 space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Ad</Label>
                <Input
                  value={categoryDraft.name}
                  placeholder="Örn. Kardiyoloji"
                  onChange={(e) =>
                    setCategoryDraft((d) => ({
                      ...d,
                      name: e.target.value,
                      slug: editingCategory ? d.slug : slugify(e.target.value),
                    }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>Kısa yol (slug)</Label>
                <Input
                  value={categoryDraft.slug}
                  onChange={(e) => setCategoryDraft((d) => ({ ...d, slug: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Açıklama</Label>
              <Textarea
                rows={2}
                value={categoryDraft.description}
                onChange={(e) => setCategoryDraft((d) => ({ ...d, description: e.target.value }))}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Sıra</Label>
                <Input
                  type="number"
                  value={categoryDraft.sort_order}
                  onChange={(e) =>
                    setCategoryDraft((d) => ({ ...d, sort_order: Number(e.target.value) }))
                  }
                />
              </div>
              <div className="flex items-end gap-2">
                <Button
                  className="flex-1"
                  disabled={saveCategory.isPending || categoryDraft.name.trim().length === 0}
                  onClick={() => saveCategory.mutate({ id: editingCategory, draft: categoryDraft })}
                >
                  {editingCategory ? (
                    <>
                      <Check className="mr-1 size-4" /> Güncelle
                    </>
                  ) : (
                    <>
                      <Plus className="mr-1 size-4" /> Ekle
                    </>
                  )}
                </Button>
                {editingCategory ? (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditingCategory(null);
                      setCategoryDraft({ ...emptyCategory });
                    }}
                  >
                    <X className="size-4" />
                  </Button>
                ) : null}
              </div>
            </div>
          </div>

          <div className="mt-6 space-y-2">
            {categories.length === 0 ? (
              <p className="text-sm text-muted-foreground">Henüz kategori eklenmedi.</p>
            ) : (
              categories.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{item.name}</p>
                    <p className="truncate text-xs text-muted-foreground">/kategori/{item.slug}</p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button size="sm" variant="outline" onClick={() => startEditCategory(item)}>
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        if (confirm(`"${item.name}" kategorisi silinsin mi?`))
                          removeCategory.mutate(item.id);
                      }}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Etiketler */}
        <section className="rounded-xl border border-border bg-card p-5 shadow-card">
          <h2 className="text-lg font-semibold">Etiketler</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Konu bazlı serbest anahtar kelimeler. Bir içeriğe birden çok etiket eklenebilir.
          </p>

          <div className="mt-4 space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Ad</Label>
                <Input
                  value={tagDraft.name}
                  placeholder="Örn. EKG"
                  onChange={(e) =>
                    setTagDraft((d) => ({
                      ...d,
                      name: e.target.value,
                      slug: editingTag ? d.slug : slugify(e.target.value),
                    }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>Kısa yol (slug)</Label>
                <Input
                  value={tagDraft.slug}
                  onChange={(e) => setTagDraft((d) => ({ ...d, slug: e.target.value }))}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                disabled={saveTag.isPending || tagDraft.name.trim().length === 0}
                onClick={() => saveTag.mutate({ id: editingTag, draft: tagDraft })}
              >
                {editingTag ? (
                  <>
                    <Check className="mr-1 size-4" /> Güncelle
                  </>
                ) : (
                  <>
                    <Plus className="mr-1 size-4" /> Ekle
                  </>
                )}
              </Button>
              {editingTag ? (
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditingTag(null);
                    setTagDraft({ ...emptyTag });
                  }}
                >
                  <X className="size-4" />
                </Button>
              ) : null}
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            {tags.length === 0 ? (
              <p className="text-sm text-muted-foreground">Henüz etiket eklenmedi.</p>
            ) : (
              tags.map((item) => (
                <span
                  key={item.id}
                  className="inline-flex items-center gap-1 rounded-full border border-border bg-background py-1 pl-3 pr-1 text-xs font-medium"
                >
                  {item.name}
                  <button
                    type="button"
                    aria-label={`${item.name} etiketini düzenle`}
                    className="rounded-full p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
                    onClick={() => startEditTag(item)}
                  >
                    <Pencil className="size-3" />
                  </button>
                  <button
                    type="button"
                    aria-label={`${item.name} etiketini sil`}
                    className="rounded-full p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => {
                      if (confirm(`"${item.name}" etiketi silinsin mi?`)) removeTag.mutate(item.id);
                    }}
                  >
                    <Trash2 className="size-3" />
                  </button>
                </span>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
