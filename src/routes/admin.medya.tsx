import { useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check, Copy, ImageIcon, Loader2, Search, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  deleteMedia,
  formatBytes,
  mediaFolderLabels,
  mediaFolders,
  mediaListQuery,
  uploadMedia,
  type MediaFolder,
} from "@/lib/media";
import { formatDate } from "@/lib/content";

export const Route = createFileRoute("/admin/medya")({
  component: AdminMedia,
});

function AdminMedia() {
  const qc = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [term, setTerm] = useState("");
  const [folderFilter, setFolderFilter] = useState("all");
  const [target, setTarget] = useState<MediaFolder>("genel");
  const [selected, setSelected] = useState<string[]>([]);
  const [copied, setCopied] = useState<string | null>(null);

  const { data: files = [], isLoading, error } = useQuery(mediaListQuery());

  const upload = useMutation({
    // Kopyalanmis dizi alir; bkz. MediaPicker'daki ayni not.
    mutationFn: async (list: File[]) => {
      let count = 0;
      for (const file of list) {
        await uploadMedia(file, target);
        count += 1;
      }
      return count;
    },
    onSuccess: async (count) => {
      await qc.invalidateQueries({ queryKey: ["media"] });
      toast.success(`${count} görsel yüklendi`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: (paths: string[]) => deleteMedia(paths),
    onSuccess: async () => {
      setSelected([]);
      await qc.invalidateQueries({ queryKey: ["media"] });
      toast.success("Seçilen görseller silindi");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const folders = Array.from(new Set(files.map((f) => f.folder))).sort();
  const filtered = files.filter((file) => {
    if (folderFilter !== "all" && file.folder !== folderFilter) return false;
    if (term.trim() && !file.path.toLowerCase().includes(term.trim().toLowerCase())) return false;
    return true;
  });

  const toggle = (path: string) =>
    setSelected((list) => (list.includes(path) ? list.filter((p) => p !== path) : [...list, path]));

  async function copyUrl(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(url);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      toast.error("Kopyalanamadı, adresi elle seçip kopyalayın.");
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Medya kütüphanesi</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sitede kullanılan tüm görseller. Buradan yükleyip yazılarda ve sayfalarda
            kullanabilirsiniz.
          </p>
        </div>
        <div className="flex items-end gap-2">
          <div className="space-y-1">
            <Label className="text-xs">Klasör</Label>
            <Select value={target} onValueChange={(v) => setTarget(v as MediaFolder)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {mediaFolders.map((folder) => (
                  <SelectItem key={folder} value={folder}>
                    {mediaFolderLabels[folder]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={() => inputRef.current?.click()} disabled={upload.isPending}>
            {upload.isPending ? (
              <Loader2 className="mr-1.5 size-4 animate-spin" />
            ) : (
              <Upload className="mr-1.5 size-4" />
            )}
            Görsel yükle
          </Button>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              // Once kopyala, sonra input'u sifirla: sifirlama FileList'i bosaltir.
              const picked = Array.from(e.target.files ?? []);
              e.target.value = "";
              if (picked.length) upload.mutate(picked);
            }}
          />
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="relative min-w-56 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Dosya adında ara"
            className="pl-9"
          />
        </div>
        <Select value={folderFilter} onValueChange={setFolderFilter}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm klasörler</SelectItem>
            {folders.map((folder) => (
              <SelectItem key={folder} value={folder}>
                {mediaFolderLabels[folder as MediaFolder] ?? folder}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selected.length > 0 ? (
          <Button
            variant="destructive"
            onClick={() => {
              if (confirm(`${selected.length} görsel kalıcı olarak silinsin mi?`)) {
                remove.mutate(selected);
              }
            }}
            disabled={remove.isPending}
          >
            <Trash2 className="mr-1.5 size-4" /> {selected.length} görseli sil
          </Button>
        ) : null}
      </div>

      <p className="mt-3 text-xs text-muted-foreground">
        {filtered.length} görsel · toplam {formatBytes(filtered.reduce((s, f) => s + f.size, 0))}
      </p>

      {isLoading ? (
        <p className="mt-10 text-sm text-muted-foreground">Yükleniyor…</p>
      ) : error ? (
        <p className="mt-10 text-sm text-destructive">
          Kütüphane açılamadı: {(error as Error).message}
        </p>
      ) : filtered.length === 0 ? (
        <div className="mt-16 text-center">
          <ImageIcon className="mx-auto size-10 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">
            {files.length === 0 ? "Henüz görsel yüklenmemiş." : "Eşleşen görsel yok."}
          </p>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map((file) => {
            const on = selected.includes(file.path);
            return (
              <div
                key={file.path}
                className={`overflow-hidden rounded-xl border bg-card shadow-card transition-colors ${
                  on ? "border-primary ring-2 ring-primary/30" : "border-border"
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggle(file.path)}
                  className="block w-full"
                  aria-pressed={on}
                >
                  <span className="flex h-32 items-center justify-center bg-muted">
                    <img
                      src={file.url}
                      alt={file.name}
                      loading="lazy"
                      className="max-h-full max-w-full object-contain"
                    />
                  </span>
                </button>
                <div className="space-y-1 p-3">
                  <p className="truncate text-xs font-medium" title={file.name}>
                    {file.name}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {mediaFolderLabels[file.folder as MediaFolder] ?? file.folder} ·{" "}
                    {formatBytes(file.size)}
                    {file.createdAt ? ` · ${formatDate(file.createdAt)}` : ""}
                  </p>
                  <div className="flex gap-1 pt-1">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 flex-1 text-[11px]"
                      onClick={() => copyUrl(file.url)}
                    >
                      {copied === file.url ? (
                        <Check className="mr-1 size-3" />
                      ) : (
                        <Copy className="mr-1 size-3" />
                      )}
                      {copied === file.url ? "Kopyalandı" : "Adresi kopyala"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 px-2"
                      aria-label={`${file.name} sil`}
                      onClick={() => {
                        if (confirm(`"${file.name}" kalıcı olarak silinsin mi?`)) {
                          remove.mutate([file.path]);
                        }
                      }}
                    >
                      <Trash2 className="size-3" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <p className="mt-8 rounded-lg border border-border bg-muted/40 p-4 text-xs text-muted-foreground">
        <strong className="text-foreground">Dikkat:</strong> Silinen görsel, kullanıldığı yazı ve
        sayfalarda da kaybolur. Silmeden önce görselin bir yerde kullanılmadığından emin olun.
      </p>
    </div>
  );
}
