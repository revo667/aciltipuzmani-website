-- Kategori ve etiket taksonomisi.
-- Kategoriler ve etiketler panelden yonetilir; yazilara ve sayfalara coklu atanir.

CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.categories TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categories TO authenticated;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY categories_public_read ON public.categories FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY categories_staff_insert ON public.categories FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY categories_staff_update ON public.categories FOR UPDATE TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY categories_staff_delete ON public.categories FOR DELETE TO authenticated USING (public.is_staff(auth.uid()));
CREATE TRIGGER categories_updated_at BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.tags TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tags TO authenticated;
GRANT ALL ON public.tags TO service_role;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY tags_public_read ON public.tags FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY tags_staff_insert ON public.tags FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY tags_staff_update ON public.tags FOR UPDATE TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY tags_staff_delete ON public.tags FOR DELETE TO authenticated USING (public.is_staff(auth.uid()));
CREATE TRIGGER tags_updated_at BEFORE UPDATE ON public.tags
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.post_categories (
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, category_id)
);
CREATE INDEX post_categories_category_idx ON public.post_categories (category_id);

CREATE TABLE public.post_tags (
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, tag_id)
);
CREATE INDEX post_tags_tag_idx ON public.post_tags (tag_id);

CREATE TABLE public.page_categories (
  page_id uuid NOT NULL REFERENCES public.pages(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  PRIMARY KEY (page_id, category_id)
);
CREATE INDEX page_categories_category_idx ON public.page_categories (category_id);

CREATE TABLE public.page_tags (
  page_id uuid NOT NULL REFERENCES public.pages(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  PRIMARY KEY (page_id, tag_id)
);
CREATE INDEX page_tags_tag_idx ON public.page_tags (tag_id);

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['post_categories','post_tags','page_categories','page_tags'] LOOP
    EXECUTE format('GRANT SELECT ON public.%I TO anon', t);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT TO anon, authenticated USING (true)', t || '_public_read', t);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()))', t || '_staff_insert', t);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR UPDATE TO authenticated USING (public.is_staff(auth.uid()))', t || '_staff_update', t);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR DELETE TO authenticated USING (public.is_staff(auth.uid()))', t || '_staff_delete', t);
  END LOOP;
END $$;

-- Mevcut posts.category degerlerini kategori kaydina donustur ve yazilara bagla.
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

INSERT INTO public.post_categories (post_id, category_id)
SELECT p.id, c.id
FROM public.posts p
JOIN public.categories c ON c.slug = p.category
ON CONFLICT DO NOTHING;
