import { useState } from "react";
import { Check, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type TaxonomyItem = { id: string; name: string; slug: string };

/**
 * Kategori/etiket secici. Mevcut kayitlar rozet olarak secilir,
 * alttaki alandan sifirdan yeni kayit olusturulup dogrudan secilir.
 */
export function TaxonomyPicker({
  label,
  items,
  selected,
  onChange,
  onCreate,
  placeholder,
  creating = false,
}: {
  label: string;
  items: TaxonomyItem[];
  selected: string[];
  onChange: (ids: string[]) => void;
  onCreate: (name: string) => void;
  placeholder: string;
  creating?: boolean;
}) {
  const [newName, setNewName] = useState("");

  const toggle = (id: string) =>
    onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);

  const create = () => {
    const name = newName.trim();
    if (!name || creating) return;
    onCreate(name);
    setNewName("");
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {items.length > 0 ? (
        <div className="flex flex-wrap gap-1.5 rounded-lg border border-border bg-muted/40 p-2">
          {items.map((item) => {
            const active = selected.includes(item.id);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => toggle(item.id)}
                aria-pressed={active}
                className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                {active ? <Check className="size-3" /> : null}
                {item.name}
              </button>
            );
          })}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">
          Henüz kayıt yok. Aşağıdan yeni bir tane oluşturabilirsiniz.
        </p>
      )}
      <div className="flex gap-2">
        <Input
          value={newName}
          placeholder={placeholder}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              create();
            }
          }}
        />
        <Button
          type="button"
          variant="outline"
          disabled={creating || newName.trim().length === 0}
          onClick={create}
        >
          <Plus className="mr-1 size-4" /> Ekle
        </Button>
      </div>
    </div>
  );
}
