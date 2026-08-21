CREATE TABLE public.pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  content text NOT NULL DEFAULT '',
  excerpt text,
  cover_url text,
  status text NOT NULL DEFAULT 'published',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.pages TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pages TO authenticated;
GRANT ALL ON public.pages TO service_role;
ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;
CREATE POLICY pages_anon_read ON public.pages FOR SELECT TO anon USING (status = 'published');
CREATE POLICY pages_auth_read ON public.pages FOR SELECT TO authenticated USING (status = 'published' OR is_staff(auth.uid()));
CREATE POLICY pages_staff_insert ON public.pages FOR INSERT TO authenticated WITH CHECK (is_staff(auth.uid()));
CREATE POLICY pages_staff_update ON public.pages FOR UPDATE TO authenticated USING (is_staff(auth.uid()));
CREATE POLICY pages_staff_delete ON public.pages FOR DELETE TO authenticated USING (is_staff(auth.uid()));
CREATE TRIGGER pages_updated_at BEFORE UPDATE ON public.pages FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.menu_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL,
  href text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  visible boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.menu_items TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.menu_items TO authenticated;
GRANT ALL ON public.menu_items TO service_role;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY menu_items_public_read ON public.menu_items FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY menu_items_staff_insert ON public.menu_items FOR INSERT TO authenticated WITH CHECK (is_staff(auth.uid()));
CREATE POLICY menu_items_staff_update ON public.menu_items FOR UPDATE TO authenticated USING (is_staff(auth.uid()));
CREATE POLICY menu_items_staff_delete ON public.menu_items FOR DELETE TO authenticated USING (is_staff(auth.uid()));
CREATE TRIGGER menu_items_updated_at BEFORE UPDATE ON public.menu_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.menu_items (label, href, sort_order) VALUES
  ('Anasayfa', '/', 1),
  ('Haberler', '/haberler', 2),
  ('Etkinlikler', '/etkinlikler', 3),
  ('Kaynaklar', '/kaynaklar', 4);