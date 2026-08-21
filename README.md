# Acil Tıp Uzmanı - Proje Kaynak Kodları

Bu arşiv, **Acil Tıp Uzmanı** haber ve etkinlik portalının tam kaynak kodlarını içerir. Lovable / TanStack Start + Supabase altyapısı kullanılarak geliştirilmiştir.

## İçindekiler

- `src/` — React / TanStack Start uygulama kodları (sayfalar, bileşenler, kancalar, kütüphaneler)
- `supabase/migrations/` — Veritabanı şema ve RLS migration dosyaları
- `public/` — Statik dosyalar (favicon, robots.txt)
- `.env.example` — Gerekli ortam değişkenleri şablonu
- `package.json` — Bağımlılık listesi

## Özellikler

- Haber / yazı yönetimi (CRUD)
- Yaklaşan etkinlikler takvimi
- Dış bağlantılar ve kaynaklar duvarı
- Kayan logo bandı (marquee)
- Dış yazılar şeridi (manuel kaydırma)
- Dinamik sayfalar ve menü yönetimi
- Admin paneli (secret kullanıcı adı / şifre ile)
- Anasayfa bölüm başlıklarının yönetimi
- Supabase Auth + RLS ile güvenlik

## Kurulum

1. Arşivi açın:

   ```bash
   unzip aciltipuzmani-tum-kaynaklar.zip
   cd aciltipuzmani
   ```

2. Bağımlılıkları yükleyin:

   ```bash
   bun install
   # veya
   npm install
   ```

3. `.env.example` dosyasını kopyalayıp kendi değerlerinizle doldurun:

   ```bash
   cp .env.example .env
   ```

   Gerekli değişkenler:
   - `SUPABASE_URL` — Supabase proje URL'si
   - `SUPABASE_PUBLISHABLE_KEY` — Anon / public key
   - `SUPABASE_SERVICE_ROLE_KEY` — Service role key (sunucu tarafında kullanılır)
   - `VITE_SUPABASE_URL` — Tarayıcı tarafı için aynı Supabase URL
   - `VITE_SUPABASE_PUBLISHABLE_KEY` — Tarayıcı tarafı için public key
   - `ADMIN_USERNAME` — Admin paneli giriş kullanıcı adı
   - `ADMIN_PASSWORD` — Admin paneli giriş şifresi

4. Supabase migrations dosyalarını çalıştırın:

   ```bash
   supabase migration up
   ```

   veya `supabase/migrations/` içindeki `.sql` dosyalarını sırayla veritabanınızda çalıştırın.

5. Geliştirme sunucusunu başlatın:

   ```bash
   bun run dev
   # veya
   npm run dev
   ```

   Uygulama genellikle `http://localhost:8080` adresinde çalışır.

## Admin Paneline Erişim

- Admin paneli `admin.aciltipuzmani.com` alt alan adı üzerinden veya geliştirme ortamında `http://localhost:8080/giris` adresinden erişilir.
- Giriş için `.env` içinde tanımlanan `ADMIN_USERNAME` ve `ADMIN_PASSWORD` kullanılır.

## Önemli Notlar

- Bu arşivde **gizli anahtarlar (API key, şifre vb.) yer almaz**. `.env` dosyasını kendiniz oluşturmalısınız.
- `node_modules` klasörü arşive dahil edilmemiştir; bağımlılıkları yüklemek için yukarıdaki adımları takip edin.
- `.git`, derleme çıktıları ve geçici dosyalar arşivden çıkarılmıştır.

## Teknolojiler

- TanStack Start
- React 19
- TypeScript
- Tailwind CSS v4
- shadcn/ui
- Supabase (Auth + PostgreSQL + Storage)
