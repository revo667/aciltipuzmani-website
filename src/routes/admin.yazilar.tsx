import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TaxonomyPicker } from "@/components/admin/TaxonomyPicker";
import { RichEditor } from "@/components/admin/RichEditor";
import { ImageField } from "@/components/admin/ImageField";
import { SeoFields, type SeoDraft } from "@/components/admin/SeoFields";
import { categoriesQuery, formatDate, slugify, tagsQuery, type Post } from "@/lib/content";
import { createCategory, createTag, savePostTaxonomy } from "@/lib/taxonomy";
import { fromLocalInput, toLocalInput } from "@/lib/datetime";

export const Route = createFileRoute("/admin/yazilar")({
  component: AdminPosts,
});

const PAGE_SIZE = 20;

type Draft = SeoDraft & {
  id?: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  cover_url: string;
  category: string;
  status: string;
  /** datetime-local girdisi; bos ise yayinlanirken "simdi" kullanilir. */
  published_at: string;
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
  published_at: "",
  categoryIds: [],
  tagIds: [],
  seo_title: "",
  seo_description: "",
  og_image_url: "",
};

function AdminPosts() {
  const qc = useQueryClient();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [term, setTerm] = useState("");
  const [debounced, setDebounced] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [page, setPage] = useState(0);

  // Her tusa basista sorgu atmamak icin arama terimi geciktirilir.
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebounced(term);
      setPage(0);
    }, 300);
    return () => clearTimeout(timer);
  }, [term]);

  const { data: categories = [] } = useQuery(categoriesQuery());
  const { data: tags = [] } = useQuery(tagsQuery());

  const { data: result, isLoading } = useQuery({
    queryKey: ["admin", "posts", { debounced, statusFilter, categoryFilter, page }],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      let q = supabase
        .from("posts")
        .select("*", { count: "exact" })
        .order("published_at", { ascending: false, nullsFirst: true })
        .order("created_at", { ascending: false })
        .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);

      if (statusFilter !== "all") q = q.eq("status", statusFilter);
      if (categoryFilter !== "all") q = q.eq("category", categoryFilter);
      const clean = debounced.trim().replace(/[,()%\\]/g, " ");
      if (clean.length >= 2) {
        q = q.or(`title.ilike.%${clean}%,slug.ilike.%${clean}%,excerpt.ilike.%${clean}%`);
      }

      const { data, error, count } = await q;
      if (error) throw error;
      return { posts: (data ?? []) as Post[], total: count ?? 0 };
    },
  });

  const posts = result?.posts ?? [];
  const total = result?.total ?? 0;
  const lastPage = Math.max(0, Math.ceil(total / PAGE_SIZE) - 1);

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

      // Yayin tarihi artik elle yonetiliyor: taslakta bosaltilir, yayindaysa
      // panelden secilen tarih korunur. (Eskiden her kayitta bugune ceklirdi.)
      const publishedAt =
        input.status === "published"
          ? (fromLocalInput(input.published_at) ?? new Date().toISOString())
          : null;

      const payload = {
        title: input.title,
        slug: input.slug || slugify(input.title),
        excerpt: input.excerpt || null,
        content: input.content,
        cover_url: input.cover_url || null,
        category: primary?.slug ?? input.category,
        status: input.status,
        published_at: publishedAt,
        seo_title: input.seo_title || null,
        seo_description: input.seo_description || null,
        og_image_url: input.og_image_url || null,
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

  const openPost = (post: Post) =>
    setDraft({
      id: post.id,
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt ?? "",
      content: post.content,
      cover_url: post.cover_url ?? "",
      category: post.category,
      status: post.status,
      published_at: toLocalInput(post.published_at),
      categoryIds: categoryIdsOf(post.id),
      tagIds: tagIdsOf(post.id),
      seo_title: post.seo_title ?? "",
      seo_description: post.seo_description ?? "",
      og_image_url: post.og_image_url ?? "",
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

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="relative min-w-56 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Başlık, kısa yol veya özette ara"
            className="pl-9"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(v) => {
            setStatusFilter(v);
            setPage(0);
          }}
        >
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm durumlar</SelectItem>
            <SelectItem value="published">Yayında</SelectItem>
            <SelectItem value="draft">Taslak</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={categoryFilter}
          onValueChange={(v) => {
            setCategoryFilter(v);
            setPage(0);
          }}
        >
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm kategoriler</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.slug}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <p className="mt-3 text-xs text-muted-foreground">
        {total} yazı{total > PAGE_SIZE ? ` · sayfa ${page + 1}/${lastPage + 1}` : ""}
      </p>

      <div className="mt-4 space-y-3">
        {isLoading ? <p className="text-sm text-muted-foreground">Yükleniyor…</p> : null}
        {!isLoading && posts.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            Eşleşen yazı yok.
          </p>
        ) : null}
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
                {post.status === "published" ? (
                  <Button size="sm" variant="outline" asChild title="Sitede görüntüle">
                    <a href={`/haberler/${post.slug}`} target="_blank" rel="noreferrer">
                      <ExternalLink className="size-4" />
                    </a>
                  </Button>
                ) : null}
                <Button size="sm" variant="outline" onClick={() => openPost(post)}>
                  <Pencil className="size-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    if (confirm(`"${post.title}" silinsin mi? Bu işlem geri alınamaz.`)) {
                      remove.mutate(post.id);
                    }
                  }}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {lastPage > 0 ? (
        <div className="mt-6 flex items-center justify-center gap-3">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
          >
            <ChevronLeft className="mr-1 size-4" /> Önceki
          </Button>
          <span className="text-sm text-muted-foreground">
            {page + 1} / {lastPage + 1}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= lastPage}
            onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
          >
            Sonraki <ChevronRight className="ml-1 size-4" />
          </Button>
        </div>
      ) : null}

      <Dialog open={draft !== null} onOpenChange={(open) => !open && setDraft(null)}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>{draft?.id ? "Yazıyı düzenle" : "Yeni yazı"}</DialogTitle>
          </DialogHeader>
          {draft ? (
            <Tabs defaultValue="content">
              <TabsList>
                <TabsTrigger value="content">İçerik</TabsTrigger>
                <TabsTrigger value="settings">Yayın & sınıflandırma</TabsTrigger>
                <TabsTrigger value="seo">SEO & paylaşım</TabsTrigger>
              </TabsList>

              <TabsContent value="content" className="mt-5 space-y-4">
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

                <ImageField
                  label="Kapak görseli"
                  value={draft.cover_url}
                  onChange={(url) => setDraft({ ...draft, cover_url: url })}
                  folder="posts"
                  hint="Anasayfada ve haber listesinde bu görsel kullanılır. Geniş (yatay) görseller daha iyi durur."
                />

                <div className="space-y-2">
                  <Label>Özet</Label>
                  <Textarea
                    rows={2}
                    value={draft.excerpt}
                    onChange={(e) => setDraft({ ...draft, excerpt: e.target.value })}
                    placeholder="Liste ve paylaşımlarda görünen kısa tanıtım yazısı."
                  />
                </div>

                <RichEditor
                  label="İçerik"
                  value={draft.content}
                  onChange={(html) => setDraft({ ...draft, content: html })}
                  folder="posts"
                />
              </TabsContent>

              <TabsContent value="settings" className="mt-5 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Durum</Label>
                    <Select
                      value={draft.status}
                      onValueChange={(v) =>
                        setDraft({
                          ...draft,
                          status: v,
                          // Ilk kez yayina alinirken tarih alani bossa bugunu onerelim.
                          published_at:
                            v === "published" && !draft.published_at
                              ? toLocalInput(new Date().toISOString())
                              : draft.published_at,
                        })
                      }
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
                  <div className="space-y-2">
                    <Label>Yayın tarihi</Label>
                    <Input
                      type="datetime-local"
                      value={draft.published_at}
                      disabled={draft.status !== "published"}
                      onChange={(e) => setDraft({ ...draft, published_at: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground">
                      Yazının sıralanacağı tarih. Eski bir yazıyı düzenlerken burayı
                      değiştirmezseniz tarihi olduğu gibi kalır.
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Kısa yol (slug)</Label>
                  <Input
                    value={draft.slug}
                    onChange={(e) => setDraft({ ...draft, slug: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Adres: /haberler/{draft.slug || slugify(draft.title) || "…"} — yayındaki bir
                    yazıda değiştirirseniz eski bağlantılar kırılır.
                  </p>
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
              </TabsContent>

              <TabsContent value="seo" className="mt-5">
                <SeoFields
                  draft={draft}
                  onChange={(patch) => setDraft({ ...draft, ...patch })}
                  fallbackTitle={draft.title}
                  fallbackDescription={draft.excerpt}
                  fallbackImage={draft.cover_url}
                  folder="posts"
                />
              </TabsContent>
            </Tabs>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDraft(null)}>
              Vazgeç
            </Button>
            <Button
              disabled={save.isPending || !draft?.title}
              onClick={() => draft && save.mutate(draft)}
            >
              {save.isPending ? "Kaydediliyor…" : "Kaydet"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
