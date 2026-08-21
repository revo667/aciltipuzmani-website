CREATE TABLE public.external_articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  url text NOT NULL,
  source_name text NOT NULL,
  cover_url text,
  tags text[] NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'published',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.external_articles TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.external_articles TO authenticated;
GRANT ALL ON public.external_articles TO service_role;
ALTER TABLE public.external_articles ENABLE ROW LEVEL SECURITY;
CREATE POLICY external_articles_public_read ON public.external_articles FOR SELECT TO anon, authenticated
  USING (status = 'published' OR public.is_staff(auth.uid()));
CREATE POLICY external_articles_staff_insert ON public.external_articles FOR INSERT TO authenticated
  WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY external_articles_staff_update ON public.external_articles FOR UPDATE TO authenticated
  USING (public.is_staff(auth.uid()));
CREATE POLICY external_articles_staff_delete ON public.external_articles FOR DELETE TO authenticated
  USING (public.is_staff(auth.uid()));
CREATE TRIGGER external_articles_updated_at BEFORE UPDATE ON public.external_articles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.external_articles (title, url, source_name, cover_url, tags, sort_order) VALUES
  ('Akut Arter İskemisi', 'https://acilci.net/akut-arter-iskemisi', 'Acilci.net', null, ARRAY['Acil Tıp Sitelerinden','Akut Arter İskemisi'], 1),
  ('2025 Amerikan Kalp Derneği Kardiyopulmoner Resüsitasyon ve Acil Kardiyovasküler Bakım Kılavuzları - Bölüm 8', 'https://acilci.net/2025-ahakardiyopulmoner-resusitasyon-ve-acil-kardiyovaskuler-bakim-kilavuzlari-bolum-8', 'Acilci.net', null, ARRAY['Acil Tıp Sitelerinden','Kardiyoloji','Resüsitasyon'], 2),
  ('Acil Serviste Göğüs Ağrısına Yaklaşım: Yüksek Duyarlılıklı Troponin Protokolleri', 'https://aciltip.com/acil-serviste-gogus-agrisina-yaklasim', 'aciltip.com', null, ARRAY['Acil Tıp Sitelerinden','Kardiyoloji','Troponin'], 3),
  ('Metoklopramid (Metpamid®) Ampul Uygulama Akıl Kartı', 'https://acilcalisanlari.com/metoklopramid-metpamid-ampul-uygulama-akil-karti', 'acilcalisanlari.com', null, ARRAY['Acil Tıp Sitelerinden','Akıl Kartı','Farmakoloji','Metoklopramid','Metpamid'], 4);