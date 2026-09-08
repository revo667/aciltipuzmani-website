-- Kategori ve etiket taksonomisi.
-- Kategoriler ve etiketler panelden yonetilir; yazilara ve sayfalara coklu atanir.
-- Not: Tekrar calistirilabilir (idempotent) yazildi.

CREATE TABLE IF NOT EXISTS public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.post_categories (
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, category_id)
);
CREATE INDEX IF NOT EXISTS post_categories_category_idx ON public.post_categories (category_id);

CREATE TABLE IF NOT EXISTS public.post_tags (
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, tag_id)
);
CREATE INDEX IF NOT EXISTS post_tags_tag_idx ON public.post_tags (tag_id);

CREATE TABLE IF NOT EXISTS public.page_categories (
  page_id uuid NOT NULL REFERENCES public.pages(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  PRIMARY KEY (page_id, category_id)
);
CREATE INDEX IF NOT EXISTS page_categories_category_idx ON public.page_categories (category_id);

CREATE TABLE IF NOT EXISTS public.page_tags (
  page_id uuid NOT NULL REFERENCES public.pages(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  PRIMARY KEY (page_id, tag_id)
);
CREATE INDEX IF NOT EXISTS page_tags_tag_idx ON public.page_tags (tag_id);

-- Yetkiler ve RLS: sitedeki diger tablolarla ayni duzen.
-- Herkes okur, yalnizca editor/yonetici yazar.
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'categories','tags','post_categories','post_tags','page_categories','page_tags'
  ] LOOP
    EXECUTE format('GRANT SELECT ON public.%I TO anon', t);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);

    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_public_read', t);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR SELECT TO anon, authenticated USING (true)',
      t || '_public_read', t);

    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_staff_insert', t);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()))',
      t || '_staff_insert', t);

    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_staff_update', t);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR UPDATE TO authenticated USING (public.is_staff(auth.uid()))',
      t || '_staff_update', t);

    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_staff_delete', t);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR DELETE TO authenticated USING (public.is_staff(auth.uid()))',
      t || '_staff_delete', t);
  END LOOP;
END $$;

DROP TRIGGER IF EXISTS categories_updated_at ON public.categories;
CREATE TRIGGER categories_updated_at BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS tags_updated_at ON public.tags;
CREATE TRIGGER tags_updated_at BEFORE UPDATE ON public.tags
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Mevcut posts.category degerlerini kategori kaydina donustur.
INSERT INTO public.categories (name, slug, sort_order)
SELECT
  CASE p.category
    WHEN 'haber' THEN 'Haber'
    WHEN 'rehber' THEN 'Rehber'
    WHEN 'duyuru' THEN 'Duyuru'
    ELSE initcap(replace(p.category, '-', ' '))
  END,
  p.category,
  0
FROM (SELECT DISTINCT category FROM public.posts WHERE coalesce(category, '') <> '') p
ON CONFLICT (slug) DO NOTHING;

-- Panelde varsayilan olarak hazir dursunlar.
INSERT INTO public.categories (name, slug, sort_order) VALUES
  ('Haber', 'haber', 1),
  ('Rehber', 'rehber', 2),
  ('Duyuru', 'duyuru', 3)
ON CONFLICT (slug) DO NOTHING;

-- Yazilari mevcut kategorilerine bagla.
INSERT INTO public.post_categories (post_id, category_id)
SELECT p.id, c.id
FROM public.posts p
JOIN public.categories c ON c.slug = p.category
ON CONFLICT DO NOTHING;

-- PostgREST sema onbellegini tazele (yeni tablolar hemen API'de gorunsun).
NOTIFY pgrst, 'reload schema';
