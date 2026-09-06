import { supabase } from "@/integrations/supabase/client";
import { slugify, type Category, type Tag } from "@/lib/content";

/** Ayni slug varsa mevcut kayit geri doner; kopya olusmaz. */
export async function createCategory(name: string): Promise<Category> {
  const trimmed = name.trim();
  const { data, error } = await supabase
    .from("categories")
    .upsert({ name: trimmed, slug: slugify(trimmed) }, { onConflict: "slug" })
    .select("id,name,slug,description,sort_order")
    .single();
  if (error) throw error;
  return data as Category;
}

export async function createTag(name: string): Promise<Tag> {
  const trimmed = name.trim();
  const { data, error } = await supabase
    .from("tags")
    .upsert({ name: trimmed, slug: slugify(trimmed) }, { onConflict: "slug" })
    .select("id,name,slug")
    .single();
  if (error) throw error;
  return data as Tag;
}

/** Yazinin kategori/etiket baglarini verilen listeyle degistirir. */
export async function savePostTaxonomy(postId: string, categoryIds: string[], tagIds: string[]) {
  const delCats = await supabase.from("post_categories").delete().eq("post_id", postId);
  if (delCats.error) throw delCats.error;
  if (categoryIds.length > 0) {
    const { error } = await supabase
      .from("post_categories")
      .insert(categoryIds.map((category_id) => ({ post_id: postId, category_id })));
    if (error) throw error;
  }

  const delTags = await supabase.from("post_tags").delete().eq("post_id", postId);
  if (delTags.error) throw delTags.error;
  if (tagIds.length > 0) {
    const { error } = await supabase
      .from("post_tags")
      .insert(tagIds.map((tag_id) => ({ post_id: postId, tag_id })));
    if (error) throw error;
  }
}

/** Sayfanin kategori/etiket baglarini verilen listeyle degistirir. */
export async function savePageTaxonomy(pageId: string, categoryIds: string[], tagIds: string[]) {
  const delCats = await supabase.from("page_categories").delete().eq("page_id", pageId);
  if (delCats.error) throw delCats.error;
  if (categoryIds.length > 0) {
    const { error } = await supabase
      .from("page_categories")
      .insert(categoryIds.map((category_id) => ({ page_id: pageId, category_id })));
    if (error) throw error;
  }

  const delTags = await supabase.from("page_tags").delete().eq("page_id", pageId);
  if (delTags.error) throw delTags.error;
  if (tagIds.length > 0) {
    const { error } = await supabase
      .from("page_tags")
      .insert(tagIds.map((tag_id) => ({ page_id: pageId, tag_id })));
    if (error) throw error;
  }
}
