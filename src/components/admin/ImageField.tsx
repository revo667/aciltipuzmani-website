import { useState } from "react";
import { ImageIcon, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { MediaPicker } from "@/components/admin/MediaPicker";

/**
 * Panelin her yerinde ayni gorsel secme deneyimi: onizleme + "Görsel seç"
 * dugmesi. URL yapistirma da MediaPicker icindeki Baglanti sekmesinde.
 */
export function ImageField({
  label,
  value,
  onChange,
  folder = "genel",
  hint,
  previewClassName = "h-28",
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
  folder?: string;
  hint?: string;
  previewClassName?: string;
}) {
  const [picking, setPicking] = useState(false);

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex items-start gap-3">
        <span
          className={`flex ${previewClassName} w-36 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted`}
        >
          {value ? (
            <img src={value} alt="" className="max-h-full max-w-full object-contain" />
          ) : (
            <ImageIcon className="size-6 text-muted-foreground" />
          )}
        </span>
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setPicking(true)}>
              <Upload className="mr-1.5 size-3.5" />
              {value ? "Değiştir" : "Görsel seç"}
            </Button>
            {value ? (
              <Button type="button" variant="ghost" size="sm" onClick={() => onChange("")}>
                <X className="mr-1.5 size-3.5" /> Kaldır
              </Button>
            ) : null}
          </div>
          {value ? (
            <p className="truncate text-xs text-muted-foreground" title={value}>
              {value}
            </p>
          ) : null}
          {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
        </div>
      </div>

      <MediaPicker
        open={picking}
        onOpenChange={setPicking}
        onSelect={onChange}
        folder={folder}
        title={label}
      />
    </div>
  );
}
