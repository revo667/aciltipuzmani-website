-- Yedekte ve canli sitede bulunamayan 2 gorselin <img> etiketini kaldir.
-- Dosyalar kalici olarak kayip; kirik gorsel ikonu gostermek yerine etiketi siliyoruz.

DO $$
DECLARE m text;
BEGIN
  FOR m IN SELECT unnest(ARRAY[
    '<img src="/wp-images/2025/02/Adsiz-Tasarim-kopyasi4.jpg" height="300" width="300"/>',
    '<img src="/wp-images/2025/02/Ekran-goruntusu-2025-02-06-233654_batcheditor_fotor.jpg" height="236" width="689"/>',
    '<img src="/wp-images/2025/02/Ekran-goruntusu-2025-02-06-233654_batcheditor_fotor.jpg"/>'
  ]) LOOP
    UPDATE public.posts SET content = replace(content, m, '') WHERE position(m in content) > 0;
    UPDATE public.pages SET content = replace(content, m, '') WHERE position(m in content) > 0;
  END LOOP;
END $$;
