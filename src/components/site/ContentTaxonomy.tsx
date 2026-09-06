import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Tag as TagIcon } from "lucide-react";
import { categoriesQuery, pageTaxonomyQuery, postTaxonomyQuery, tagsQuery } from "@/lib/content";

/** Yazi/sayfa altinda kategori ve etiket rozetleri; her biri arsiv sayfasina gider. */
export function ContentTaxonomy({
  kind,
  id,
  className,
}: {
  kind: "post" | "page";
  id: string;
  className?: string;
}) {
  const taxonomy = useQuery(kind === "post" ? postTaxonomyQuery(id) : pageTaxonomyQuery(id));
  const { data: categories = [] } = useQuery(categoriesQuery());
  const { data: tags = [] } = useQuery(tagsQuery());

  const selectedCategories = categories.filter((c) => taxonomy.data?.categoryIds.includes(c.id));
  const selectedTags = tags.filter((t) => taxonomy.data?.tagIds.includes(t.id));

  if (selectedCategories.length === 0 && selectedTags.length === 0) return null;

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className ?? ""}`}>
      {selectedCategories.map((category) => (
        <Link
          key={category.id}
          to="/kategori/$slug"
          params={{ slug: category.slug }}
          className="inline-flex items-center rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
        >
          {category.name}
        </Link>
      ))}
      {selectedTags.map((tag) => (
        <Link
          key={tag.id}
          to="/etiket/$slug"
          params={{ slug: tag.slug }}
          className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-primary hover:text-primary"
        >
          <TagIcon className="size-3" />
          {tag.name}
        </Link>
      ))}
    </div>
  );
}
