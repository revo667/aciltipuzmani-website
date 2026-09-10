-- Guvenlik sertlestirmesi.

-- 1) Yeni kayit olan hesap, sistemde hic yonetici yoksa otomatik yonetici oluyordu.
--    Supabase'de kayit (signup) acik oldugu icin bu bir yetki yukseltme kapisi:
--    yoneticiler bir sekilde silinirse ilk kayit olan yabanci yonetici olur.
--    Yonetici/editor rolleri artik yalnizca sunucuda (service role) atanir.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user')
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END; $function$;

-- 2) Yonetici girisi icin kaba kuvvet (brute force) sinirlamasi. Worker'lar arasi
--    ortak bir sayac gerektigi icin veritabaninda tutulur; yalnizca service role erisir.
CREATE TABLE IF NOT EXISTS public.rate_limits (
  key text PRIMARY KEY,
  hits integer NOT NULL DEFAULT 0,
  window_started_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.rate_limits FROM anon, authenticated;
GRANT ALL ON public.rate_limits TO service_role;

-- Anahtar icin bir deneme sayar; pencere icindeki deneme sayisi _max'i asmadiysa true doner.
CREATE OR REPLACE FUNCTION public.hit_rate_limit(_key text, _max integer, _window_seconds integer)
RETURNS boolean
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
  window_start timestamptz := now() - make_interval(secs => _window_seconds);
  current_hits integer;
BEGIN
  DELETE FROM public.rate_limits WHERE window_started_at < now() - interval '1 day';

  INSERT INTO public.rate_limits AS r (key, hits, window_started_at)
  VALUES (_key, 1, now())
  ON CONFLICT (key) DO UPDATE SET
    hits = CASE WHEN r.window_started_at < window_start THEN 1 ELSE r.hits + 1 END,
    window_started_at = CASE WHEN r.window_started_at < window_start THEN now() ELSE r.window_started_at END
  RETURNING hits INTO current_hits;

  RETURN current_hits <= _max;
END; $function$;
REVOKE ALL ON FUNCTION public.hit_rate_limit(text, integer, integer) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.hit_rate_limit(text, integer, integer) TO service_role;

-- 3) 'media' bucket'ina yalnizca gorsel yuklenebilsin. Paneldeki dosya turu kontrolu
--    istemcide; API'yi dogrudan kullanan bir editor HTML/JS dosyasi yukleyebiliyordu.
UPDATE storage.buckets
SET allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
WHERE id = 'media';
