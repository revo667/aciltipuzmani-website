import { useCallback, useEffect, useState } from "react";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import TextAlign from "@tiptap/extension-text-align";
import Placeholder from "@tiptap/extension-placeholder";
import { TableKit } from "@tiptap/extension-table";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Code2,
  Heading2,
  Heading3,
  ImagePlus,
  Italic,
  Link2,
  Link2Off,
  List,
  ListOrdered,
  Minus,
  Quote,
  Redo2,
  Strikethrough,
  Table as TableIcon,
  Underline as UnderlineIcon,
  Undo2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MediaPicker } from "@/components/admin/MediaPicker";
import { cn } from "@/lib/utils";

/**
 * Yazi ve sayfa govdesi icin gorsel editor. Icerik HTML olarak saklanir;
 * WordPress'ten aktarilan eski HTML iceriklerle uyumludur.
 *
 * "Kaynak" sekmesi teknik kullanicilar icin duruyor, normal kullanim gorsel modda.
 */

type ToolbarButtonProps = {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
};

function ToolbarButton({ onClick, active, disabled, title, children }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-40",
        active && "bg-secondary text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <span className="mx-1 h-6 w-px bg-border" />;
}

function Toolbar({ editor, onPickImage }: { editor: Editor; onPickImage: () => void }) {
  const setLink = useCallback(() => {
    const previous = (editor.getAttributes("link")["href"] as string | undefined) ?? "";
    const input = window.prompt(
      "Bağlantı adresi (boş bırakırsanız bağlantı kaldırılır):",
      previous,
    );
    if (input === null) return;
    const href = input.trim();
    if (!href) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    const safe = /^(https?:\/\/|mailto:|tel:|\/)/i.test(href) ? href : `https://${href}`;
    editor.chain().focus().extendMarkRange("link").setLink({ href: safe }).run();
  }, [editor]);

  return (
    <div className="sticky top-0 z-10 flex flex-wrap items-center gap-0.5 border-b border-border bg-muted/40 p-1.5 backdrop-blur supports-[backdrop-filter]:bg-muted/60">
      <ToolbarButton
        title="Kalın"
        active={editor.isActive("bold")}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <Bold className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        title="İtalik"
        active={editor.isActive("italic")}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <Italic className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        title="Altı çizili"
        active={editor.isActive("underline")}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      >
        <UnderlineIcon className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        title="Üstü çizili"
        active={editor.isActive("strike")}
        onClick={() => editor.chain().focus().toggleStrike().run()}
      >
        <Strikethrough className="size-4" />
      </ToolbarButton>

      <Divider />

      <ToolbarButton
        title="Büyük başlık"
        active={editor.isActive("heading", { level: 2 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        <Heading2 className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        title="Küçük başlık"
        active={editor.isActive("heading", { level: 3 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
      >
        <Heading3 className="size-4" />
      </ToolbarButton>

      <Divider />

      <ToolbarButton
        title="Madde işaretli liste"
        active={editor.isActive("bulletList")}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <List className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        title="Numaralı liste"
        active={editor.isActive("orderedList")}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <ListOrdered className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        title="Alıntı"
        active={editor.isActive("blockquote")}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      >
        <Quote className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        title="Kod bloğu"
        active={editor.isActive("codeBlock")}
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
      >
        <Code2 className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        title="Ayırıcı çizgi"
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
      >
        <Minus className="size-4" />
      </ToolbarButton>

      <Divider />

      <ToolbarButton
        title="Sola hizala"
        active={editor.isActive({ textAlign: "left" })}
        onClick={() => editor.chain().focus().setTextAlign("left").run()}
      >
        <AlignLeft className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        title="Ortala"
        active={editor.isActive({ textAlign: "center" })}
        onClick={() => editor.chain().focus().setTextAlign("center").run()}
      >
        <AlignCenter className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        title="Sağa hizala"
        active={editor.isActive({ textAlign: "right" })}
        onClick={() => editor.chain().focus().setTextAlign("right").run()}
      >
        <AlignRight className="size-4" />
      </ToolbarButton>

      <Divider />

      <ToolbarButton title="Bağlantı ekle" active={editor.isActive("link")} onClick={setLink}>
        <Link2 className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        title="Bağlantıyı kaldır"
        disabled={!editor.isActive("link")}
        onClick={() => editor.chain().focus().unsetLink().run()}
      >
        <Link2Off className="size-4" />
      </ToolbarButton>
      <ToolbarButton title="Görsel ekle" onClick={onPickImage}>
        <ImagePlus className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        title="Tablo ekle (3x3)"
        onClick={() =>
          editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
        }
      >
        <TableIcon className="size-4" />
      </ToolbarButton>

      <Divider />

      <ToolbarButton
        title="Geri al"
        disabled={!editor.can().undo()}
        onClick={() => editor.chain().focus().undo().run()}
      >
        <Undo2 className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        title="Yinele"
        disabled={!editor.can().redo()}
        onClick={() => editor.chain().focus().redo().run()}
      >
        <Redo2 className="size-4" />
      </ToolbarButton>
    </div>
  );
}

export function RichEditor({
  label,
  value,
  onChange,
  folder = "posts",
  placeholder = "Yazınızı buraya yazın…",
  minHeight = "22rem",
}: {
  label?: string;
  value: string;
  onChange: (html: string) => void;
  folder?: string;
  placeholder?: string;
  minHeight?: string;
}) {
  const [mode, setMode] = useState<"visual" | "source">("visual");
  const [picking, setPicking] = useState(false);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4] },
        link: { openOnClick: false, autolink: true, HTMLAttributes: { rel: "noreferrer" } },
      }),
      Image.configure({ HTMLAttributes: { loading: "lazy" } }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      TableKit.configure({ table: { resizable: true } }),
      Placeholder.configure({ placeholder }),
    ],
    content: value || "",
    editorProps: {
      attributes: {
        class: "rich-text focus:outline-none",
        style: `min-height:${minHeight}`,
      },
    },
    onUpdate: ({ editor: instance }) => {
      const html = instance.getHTML();
      onChange(html === "<p></p>" ? "" : html);
    },
  });

  // Baska bir kayda gecildiginde (dialog yeniden acildiginda) icerigi tazele.
  useEffect(() => {
    if (!editor) return;
    if (value !== editor.getHTML() && !editor.isFocused) {
      editor.commands.setContent(value || "", { emitUpdate: false });
    }
  }, [editor, value]);

  const insertImage = (url: string) => {
    if (!editor) return;
    const alt = window.prompt("Görsel açıklaması (görme engelliler ve Google için):", "") ?? "";
    editor.chain().focus().setImage({ src: url, alt }).run();
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        {label ? <Label>{label}</Label> : <span />}
        <div className="flex rounded-md border border-border p-0.5 text-xs">
          <button
            type="button"
            onClick={() => setMode("visual")}
            className={cn(
              "rounded px-2 py-1 font-medium",
              mode === "visual" ? "bg-secondary text-foreground" : "text-muted-foreground",
            )}
          >
            Görsel
          </button>
          <button
            type="button"
            onClick={() => {
              if (editor) onChange(editor.getHTML());
              setMode("source");
            }}
            className={cn(
              "rounded px-2 py-1 font-medium",
              mode === "source" ? "bg-secondary text-foreground" : "text-muted-foreground",
            )}
          >
            Kaynak (HTML)
          </button>
        </div>
      </div>

      {mode === "visual" ? (
        <div className="relative max-h-[60vh] min-w-0 overflow-y-auto rounded-lg border border-border bg-background">
          {editor ? <Toolbar editor={editor} onPickImage={() => setPicking(true)} /> : null}
          <EditorContent editor={editor} className="min-w-0 px-4 py-3 text-sm" />
        </div>
      ) : (
        <Textarea
          rows={18}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={() => editor?.commands.setContent(value || "", { emitUpdate: false })}
          className="font-mono text-xs"
        />
      )}

      <p className="text-xs text-muted-foreground">
        Word veya başka bir siteden yapıştırdığınız metin otomatik temizlenir. Görsel eklemek için
        araç çubuğundaki resim simgesini kullanın.
      </p>

      <MediaPicker
        open={picking}
        onOpenChange={setPicking}
        onSelect={(url) => {
          if (!editor) {
            toast.error("Editör hazır değil, sayfayı yenileyin.");
            return;
          }
          insertImage(url);
        }}
        folder={folder}
        title="Yazıya görsel ekle"
      />
    </div>
  );
}

/** Editorden gelen HTML'in duz metin uzunlugu — ozet/SEO sayaclari icin. */
export function htmlToText(html: string) {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
