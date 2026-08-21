-- roles
CREATE TYPE public.app_role AS ENUM ('admin','editor','user');

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.is_staff(_user_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('admin','editor'));
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name')
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user') ON CONFLICT DO NOTHING;
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE POLICY "profiles_select_own_or_admin" ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "profiles_update_own_or_admin" ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

CREATE POLICY "user_roles_select" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

-- posts
CREATE TABLE public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT,
  content TEXT NOT NULL DEFAULT '',
  cover_url TEXT,
  category TEXT NOT NULL DEFAULT 'haber',
  status TEXT NOT NULL DEFAULT 'draft',
  published_at TIMESTAMPTZ,
  author_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.posts TO authenticated;
GRANT SELECT ON public.posts TO anon;
GRANT ALL ON public.posts TO service_role;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "posts_public_read" ON public.posts FOR SELECT TO anon, authenticated
  USING (status = 'published' OR public.is_staff(auth.uid()));
CREATE POLICY "posts_staff_insert" ON public.posts FOR INSERT TO authenticated
  WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "posts_staff_update" ON public.posts FOR UPDATE TO authenticated
  USING (public.is_staff(auth.uid()));
CREATE POLICY "posts_staff_delete" ON public.posts FOR DELETE TO authenticated
  USING (public.is_staff(auth.uid()));
CREATE TRIGGER posts_updated_at BEFORE UPDATE ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- events
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  location TEXT,
  city TEXT,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ,
  registration_url TEXT,
  cover_url TEXT,
  featured BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'published',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.events TO authenticated;
GRANT SELECT ON public.events TO anon;
GRANT ALL ON public.events TO service_role;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "events_public_read" ON public.events FOR SELECT TO anon, authenticated
  USING (status = 'published' OR public.is_staff(auth.uid()));
CREATE POLICY "events_staff_insert" ON public.events FOR INSERT TO authenticated
  WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "events_staff_update" ON public.events FOR UPDATE TO authenticated
  USING (public.is_staff(auth.uid()));
CREATE POLICY "events_staff_delete" ON public.events FOR DELETE TO authenticated
  USING (public.is_staff(auth.uid()));
CREATE TRIGGER events_updated_at BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- links (dernekler & yayınlar)
CREATE TABLE public.links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  logo_url TEXT,
  kind TEXT NOT NULL DEFAULT 'dernek',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.links TO authenticated;
GRANT SELECT ON public.links TO anon;
GRANT ALL ON public.links TO service_role;
ALTER TABLE public.links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "links_public_read" ON public.links FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "links_staff_insert" ON public.links FOR INSERT TO authenticated
  WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "links_staff_update" ON public.links FOR UPDATE TO authenticated
  USING (public.is_staff(auth.uid()));
CREATE POLICY "links_staff_delete" ON public.links FOR DELETE TO authenticated
  USING (public.is_staff(auth.uid()));
CREATE TRIGGER links_updated_at BEFORE UPDATE ON public.links
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- site settings
CREATE TABLE public.site_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_settings TO authenticated;
GRANT SELECT ON public.site_settings TO anon;
GRANT ALL ON public.site_settings TO service_role;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "settings_public_read" ON public.site_settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "settings_admin_write" ON public.site_settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER settings_updated_at BEFORE UPDATE ON public.site_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.site_settings (key, value) VALUES
('general', '{"siteName":"Acil Tıp Uzmanı","tagline":"Acil Tıp Buluşma Noktası","announcement":"Acil tıp haber, etkinlik ve kongre takvimi tek adreste.","heroTitle":"Acil Tıbbın Nabzı","heroSubtitle":"Türkiye acil tıp camiasının haber, etkinlik ve yayın merkezi.","contactEmail":"info@aciltipuzmani.com","showAnnouncement":true}'::jsonb);

INSERT INTO public.links (name, url, kind, sort_order) VALUES
('Türkiye Acil Tıp Derneği','https://www.tatd.org.tr','dernek',1),
('Acil Tıp Uzmanları Derneği','https://www.atuder.org.tr','dernek',2),
('Emergency Medicine Association of Turkey','https://www.tatd.org.tr/en','dernek',3),
('Türkiye Acil Tıp Dergisi','https://www.trjemergmed.com','yayin',1),
('Anatolian Journal of Emergency Medicine','https://www.atujem.org','yayin',2);

INSERT INTO public.posts (title, slug, excerpt, content, category, status, published_at) VALUES
('Acil serviste sepsis yönetiminde güncel yaklaşımlar','sepsis-yonetimi-guncel-yaklasimlar','Erken tanı, laktat takibi ve sıvı resüsitasyonunda son kılavuz önerileri.','Sepsis, acil servislerde mortalitesi yüksek klinik tablolardan biridir. Güncel kılavuzlar ilk bir saat içinde kan kültürü alınması, geniş spektrumlu antibiyotik başlanması ve dengeli kristalloid ile resüsitasyonu önermektedir. Laktat düzeyi 2 mmol/L üzerinde olan hastalarda tekrarlayan ölçüm yapılmalıdır.','haber','published', now() - interval '2 days'),
('Travma hastasında hızlı değerlendirme protokolü','travma-hizli-degerlendirme-protokolu','ABCDE yaklaşımı ve e-FAST kullanımına dair pratik notlar.','Travma hastasında havayolu güvenliği, solunum, dolaşım, nörolojik durum ve tam soyma sırasıyla değerlendirilir. e-FAST, hemodinamik olarak stabil olmayan hastada serbest sıvı taraması için ilk basamak görüntülemedir.','rehber','published', now() - interval '7 days'),
('Acil tıp asistan eğitiminde simülasyonun yeri','simulasyon-egitimi','Simülasyon temelli eğitim ekip iletişimini ve hata yönetimini güçlendiriyor.','Yüksek gerçeklikli simülasyon, kritik hasta yönetiminde ekip içi iletişimi ve karar verme hızını artırmaktadır. Düzenli senaryo tekrarları asistan güvenini belirgin şekilde yükseltir.','haber','published', now() - interval '14 days');

INSERT INTO public.events (title, slug, description, location, city, starts_at, ends_at, registration_url, featured) VALUES
('Uluslararası Acil Tıp Kongresi','uluslararasi-acil-tip-kongresi','Acil tıp alanında yılın en kapsamlı bilimsel buluşması.','Kongre Merkezi','Antalya', now() + interval '45 days', now() + interval '48 days','https://www.tatd.org.tr', true),
('Acil Ultrason Kursu','acil-ultrason-kursu','Uygulamalı e-FAST ve akciğer ultrasonu eğitimi.','Tıp Fakültesi','İstanbul', now() + interval '20 days', now() + interval '21 days','https://www.tatd.org.tr', false),
('Kritik Hasta Havayolu Sempozyumu','havayolu-sempozyumu','Zor havayolu yönetimi ve video laringoskopi oturumları.','Hilton Otel','Ankara', now() + interval '70 days', now() + interval '71 days', null, false);