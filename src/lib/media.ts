import { supabase } from "@/integrations/supabase/client";

/**
 * Panelden yuklenen tum gorseller Supabase Storage'daki 'media' bucket'inda tutulur.
 * Bucket public oldugu icin kalici public URL kullanilir; eski kayitlardaki
 * imzali URL'ler de calismaya devam eder.
 */

export const MEDIA_BUCKET = "media";

/** Panelin gorselleri gruplayarak sakladigi klasorler. */
export const mediaFolders = [
  "posts",
  "pages",
  "events",
  "links",
  // Eski panelin kullandigi ad; yeni yuklemeler de ayni klasore gitsin diye korunuyor.
  "external_articles",
  "brand",
  "genel",
] as const;

export type MediaFolder = (typeof mediaFolders)[number];

export const mediaFolderLabels: Record<MediaFolder, string> = {
  posts: "Yazılar",
  pages: "Sayfalar",
  events: "Etkinlikler",
  links: "Dernek & Yayın",
  external_articles: "Dış linkler",
  brand: "Logo & marka",
  genel: "Genel",
};

export type MediaFile = {
  /** Bucket icindeki tam yol, orn. "posts/abc.jpg". */
  path: string;
  name: string;
  folder: string;
  url: string;
  size: number;
  mimeType: string;
  createdAt: string | null;
};

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"];

export function mediaPublicUrl(path: string) {
  return supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path).data.publicUrl;
}

/** Dosya adini URL'de sorun cikarmayacak hale getirir, uzantisini korur. */
function safeFileName(fileName: string) {
  const dot = fileName.lastIndexOf(".");
  const base = dot > 0 ? fileName.slice(0, dot) : fileName;
  const ext = dot > 0 ? fileName.slice(dot + 1).toLowerCase() : "jpg";
  const map: Record<string, string> = {
    ç: "c",
    ğ: "g",
    ı: "i",
    ö: "o",
    ş: "s",
    ü: "u",
    Ç: "c",
    Ğ: "g",
    İ: "i",
    Ö: "o",
    Ş: "s",
    Ü: "u",
  };
  const slug = base
    .split("")
    .map((ch) => map[ch] ?? ch)
    .join("")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  const suffix = crypto.randomUUID().slice(0, 8);
  return `${slug || "gorsel"}-${suffix}.${ext.replace(/[^a-z0-9]/g, "") || "jpg"}`;
}

export function validateImage(file: File): string | null {
  if (!IMAGE_TYPES.includes(file.type)) {
    return "Yalnızca JPG, PNG, WEBP, GIF ve SVG dosyaları yüklenebilir.";
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return `Dosya çok büyük (${formatBytes(file.size)}). En fazla 10 MB yükleyebilirsiniz.`;
  }
  return null;
}

/** Gorseli yukler ve kalici public URL'ini dondurur. */
export async function uploadMedia(file: File, folder: string): Promise<MediaFile> {
  const problem = validateImage(file);
  if (problem) throw new Error(problem);

  const path = `${folder}/${safeFileName(file.name)}`;
  const { error } = await supabase.storage.from(MEDIA_BUCKET).upload(path, file, {
    cacheControl: "31536000",
    upsert: false,
    contentType: file.type,
  });
  if (error) throw error;

  return {
    path,
    name: path.split("/").pop() ?? path,
    folder,
    url: mediaPublicUrl(path),
    size: file.size,
    mimeType: file.type,
    createdAt: new Date().toISOString(),
  };
}

type StorageEntry = {
  name: string;
  id: string | null;
  created_at: string | null;
  metadata: { size?: number; mimetype?: string } | null;
};

async function listFolder(folder: string): Promise<MediaFile[]> {
  const { data, error } = await supabase.storage
    .from(MEDIA_BUCKET)
    .list(folder, { limit: 1000, sortBy: { column: "created_at", order: "desc" } });
  if (error) throw error;

  return (
    ((data ?? []) as StorageEntry[])
      // id'si olmayan kayitlar alt klasordur, dosya degil.
      .filter((entry) => entry.id !== null)
      .map((entry) => {
        const path = folder ? `${folder}/${entry.name}` : entry.name;
        return {
          path,
          name: entry.name,
          folder: folder || "/",
          url: mediaPublicUrl(path),
          size: entry.metadata?.size ?? 0,
          mimeType: entry.metadata?.mimetype ?? "",
          createdAt: entry.created_at,
        };
      })
  );
}

/**
 * Bucket'in kokundeki her klasoru tek tek gezer. Storage `list` cagrisi ic ice
 * klasorleri dondurmedigi icin iki adim gerekir.
 */
export async function listMedia(): Promise<MediaFile[]> {
  const { data: roots, error } = await supabase.storage.from(MEDIA_BUCKET).list("", { limit: 200 });
  if (error) throw error;

  const entries = (roots ?? []) as StorageEntry[];
  const folders = entries.filter((entry) => entry.id === null).map((entry) => entry.name);
  const rootFiles = entries
    .filter((entry) => entry.id !== null)
    .map((entry) => ({
      path: entry.name,
      name: entry.name,
      folder: "/",
      url: mediaPublicUrl(entry.name),
      size: entry.metadata?.size ?? 0,
      mimeType: entry.metadata?.mimetype ?? "",
      createdAt: entry.created_at,
    }));

  const nested = await Promise.all(folders.map(listFolder));
  const all = [...rootFiles, ...nested.flat()];
  all.sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
  return all;
}

export async function deleteMedia(paths: string[]) {
  if (paths.length === 0) return;
  const { error } = await supabase.storage.from(MEDIA_BUCKET).remove(paths);
  if (error) throw error;
}

export function formatBytes(bytes: number) {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const mediaListQuery = () => ({
  queryKey: ["media", "list"],
  queryFn: listMedia,
});
