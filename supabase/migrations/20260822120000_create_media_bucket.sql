-- Yonetim panelinden gorsel yuklemek icin 'media' storage bucket'i.
-- Eski projede panel uzerinden elle olusturulmustu, bu yuzden migration'larda yoktu.
-- Politikalari zaten 20260814223315 migration'i kuruyor; eksik olan tek sey bucket'in kendisiydi.

INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('media', 'media', true, 10485760)   -- 10 MB
ON CONFLICT (id) DO UPDATE SET public = true;
