-- Yazi ve sayfa basina SEO alanlari.
-- Panelden doldurulmadiginda site basligi/ozeti kullanilir; bos birakilabilir.

ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS seo_title text,
  ADD COLUMN IF NOT EXISTS seo_description text,
  ADD COLUMN IF NOT EXISTS og_image_url text;

ALTER TABLE public.pages
  ADD COLUMN IF NOT EXISTS seo_title text,
  ADD COLUMN IF NOT EXISTS seo_description text,
  ADD COLUMN IF NOT EXISTS og_image_url text;

-- Site ici arama ILIKE ile calisiyor; buyuk arsivde tarama maliyetini dusurur.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS posts_title_trgm_idx ON public.posts USING gin (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS pages_title_trgm_idx ON public.pages USING gin (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS events_title_trgm_idx ON public.events USING gin (title gin_trgm_ops);
