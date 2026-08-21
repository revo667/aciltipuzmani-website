# Kayıt Sonrası Anında Giriş

## Amaç
Yeni kayıt olan kullanıcıların e-posta doğrulama linkini beklemeden, kaydolur olmaz siteye ve (ilk kullanıcı için) yönetim paneline girebilmesi.

## Yapılacaklar

1. **E-posta doğrulaması kapatılır**
   - Kimlik doğrulama ayarlarında "otomatik onay" açılır; kayıt anında hesap doğrulanmış sayılır ve oturum hemen başlar.
   - Anonim giriş kapalı kalır, kayıt açık kalır.

2. **Giriş sayfası akışı güncellenir** (`/giris`)
   - Kayıt sonrası "E-postanı kontrol et" mesajı yerine "Hoş geldin, giriş yapıldı" bildirimi gösterilir.
   - Kayıt başarılıysa kullanıcı doğrudan anasayfaya (yetkiliyse `/admin`) yönlendirilir.

3. **Yan etki notu**
   - Doğrulama kapalıyken şifre sıfırlama e-postası hâlâ çalışır; sadece kayıt onayı adımı kalkar.
   - Doğrulanmamış e-posta ile kayıt mümkün olacağı için, ileride istenirse kaydı sadece davetle sınırlamak ayrı bir iş olarak ele alınabilir.

## Teknik detaylar
- `configure_auth` ile `auto_confirm_email: true`, `disable_signup: false`, `external_anonymous_users_enabled: false`.
- `src/routes/giris.tsx`: `signUp` sonrası `data.session` varsa toast + `navigate`; oturum yoksa mevcut bilgilendirme metni korunur.
- Ek olarak, altbilgideki iletişim bilgisi kaynaklı sunucu/istemci render uyuşmazlığı (hydration uyarısı) giderilir.
