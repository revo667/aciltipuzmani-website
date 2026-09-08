import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ImageIcon, Loader2, Search, Trash2, Upload } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { deleteMedia, formatBytes, mediaListQuery, uploadMedia, type MediaFile } from "@/lib/media";

/**
 * Gorsel secme penceresi: kutuphaneden sec, bilgisayardan yukle ya da
 * disaridan URL yapistir. Panelin her yerinde ayni bilesen kullanilir.
 */
export function MediaPicker({
  open,
  onOpenChange,
  onSelect,
  folder = "genel",
  title = "Görsel seç",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (url: string, file?: MediaFile) => void;
  /** Yeni yuklemelerin gidecegi klasor. */
  folder?: string;
  title?: string;
}) {
  const qc = useQueryClient();
  const [tab, setTab] = useState("library");
  const [term, setTerm] = useState("");
  const [urlValue, setUrlValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: files = [], isLoading, error } = useQuery({ ...mediaListQuery(), enabled: open });

  const upload = useMutation({
    // Dosyalar FileList degil, kopyalanmis bir dizi olarak gelir: input sifirlaninca
    // FileList de bosaldigi icin dogrudan FileList tutmak "0 gorsel yuklendi"ye yol aciyordu.
    mutationFn: async (list: File[]) => {
      const uploaded: MediaFile[] = [];
      for (const file of list) {
        uploaded.push(await uploadMedia(file, folder));
      }
      return uploaded;
    },
    onSuccess: async (uploaded) => {
      await qc.invalidateQueries({ queryKey: ["media"] });
      toast.success(`${uploaded.length} görsel yüklendi`);
      const last = uploaded.at(-1);
      if (last) {
        onSelect(last.url, last);
        onOpenChange(false);
      }
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: (path: string) => deleteMedia([path]),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["media"] });
      toast.success("Görsel silindi");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const filtered = term.trim()
    ? files.filter((f) => f.path.toLowerCase().includes(term.trim().toLowerCase()))
    : files;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-hidden sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Daha önce yüklediğiniz görsellerden seçebilir ya da yeni bir görsel yükleyebilirsiniz.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="library">Kütüphane</TabsTrigger>
            <TabsTrigger value="upload">Yükle</TabsTrigger>
            <TabsTrigger value="url">Bağlantı</TabsTrigger>
          </TabsList>

          <TabsContent value="library" className="mt-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                placeholder="Dosya adında ara"
                className="pl-9"
              />
            </div>

            <div className="mt-4 max-h-[46vh] overflow-y-auto pr-1">
              {isLoading ? (
                <p className="py-8 text-center text-sm text-muted-foreground">Yükleniyor…</p>
              ) : error ? (
                <p className="py-8 text-center text-sm text-destructive">
                  Kütüphane açılamadı: {(error as Error).message}
                </p>
              ) : filtered.length === 0 ? (
                <div className="py-10 text-center">
                  <ImageIcon className="mx-auto size-8 text-muted-foreground" />
                  <p className="mt-2 text-sm text-muted-foreground">
                    {term ? "Eşleşen görsel yok." : "Henüz görsel yüklenmemiş."}
                  </p>
                  <Button variant="outline" className="mt-4" onClick={() => setTab("upload")}>
                    Görsel yükle
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {filtered.map((file) => (
                    <div
                      key={file.path}
                      className="group relative overflow-hidden rounded-lg border border-border"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          onSelect(file.url, file);
                          onOpenChange(false);
                        }}
                        className="block w-full"
                      >
                        <span className="flex h-24 items-center justify-center bg-muted">
                          <img
                            src={file.url}
                            alt={file.name}
                            loading="lazy"
                            className="max-h-full max-w-full object-contain"
                          />
                        </span>
                        <span className="block truncate px-2 py-1.5 text-left text-[11px] text-muted-foreground">
                          {file.name}
                        </span>
                      </button>
                      <button
                        type="button"
                        aria-label={`${file.name} sil`}
                        onClick={() => {
                          if (confirm(`"${file.name}" kalıcı olarak silinsin mi?`)) {
                            remove.mutate(file.path);
                          }
                        }}
                        className="absolute right-1 top-1 hidden rounded-md bg-background/90 p-1.5 text-destructive shadow-sm group-hover:block"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="upload" className="mt-4">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={upload.isPending}
              className="flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed border-border p-10 text-center transition-colors hover:border-primary hover:bg-primary/5"
            >
              {upload.isPending ? (
                <Loader2 className="size-7 animate-spin text-primary" />
              ) : (
                <Upload className="size-7 text-muted-foreground" />
              )}
              <span className="text-sm font-medium">
                {upload.isPending ? "Yükleniyor…" : "Bilgisayardan görsel seç"}
              </span>
              <span className="text-xs text-muted-foreground">
                JPG, PNG, WEBP, GIF veya SVG · en fazla 10 MB · birden fazla seçebilirsiniz
              </span>
            </button>
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
          </TabsContent>

          <TabsContent value="url" className="mt-4 space-y-3">
            <Input
              value={urlValue}
              onChange={(e) => setUrlValue(e.target.value)}
              placeholder="https://ornek.com/gorsel.jpg"
            />
            <p className="text-xs text-muted-foreground">
              Başka bir sitedeki görselin adresini yapıştırabilirsiniz. O site görseli kaldırırsa
              burada da görünmez olur; kalıcı olması için yükleme sekmesini kullanın.
            </p>
            <Button
              disabled={!/^https?:\/\//i.test(urlValue.trim())}
              onClick={() => {
                onSelect(urlValue.trim());
                setUrlValue("");
                onOpenChange(false);
              }}
            >
              Bu adresi kullan
            </Button>
          </TabsContent>
        </Tabs>

        {files.length > 0 && tab === "library" ? (
          <p className="text-xs text-muted-foreground">
            {filtered.length} görsel · toplam{" "}
            {formatBytes(files.reduce((sum, f) => sum + f.size, 0))}
          </p>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
