import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { RichText } from "@/components/site/RichText";
import { ContentTaxonomy } from "@/components/site/ContentTaxonomy";
import { formatDate, postQuery, settingsQuery } from "@/lib/content";
import { pageMeta } from "@/lib/seo";

export const Route = createFileRoute("/haberler/$slug")({
  loader: async ({ context, params }) => {
    const [post, settings] = await Promise.all([
      context.queryClient.ensureQueryData(postQuery(params.slug)),
      context.queryClient.ensureQueryData(settingsQuery()),
    ]);
    if (!post || post.status !== "published") throw notFound();
    return { post, settings };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return pageMeta(undefined, { title: "İçerik bulunamadı", noindex: true });
    }
    const { post, settings } = loaderData;
    // Panelden SEO alani doldurulmadiysa yazinin kendi baslik/ozet/kapagi kullanilir.
    return pageMeta(settings, {
      title: post.seo_title || post.title,
      description: post.seo_description || post.excerpt || "",
      image: post.og_image_url || post.cover_url || "",
      type: "article",
      publishedTime: post.published_at,
    });
  },
  notFoundComponent: PostNotFound,
  component: PostDetail,
});

function PostNotFound() {
  return (
    <div className="container-page py-24 text-center">
      <h1 className="text-2xl font-semibold">İçerik bulunamadı</h1>
      <Link to="/haberler" className="mt-4 inline-block text-sm text-primary hover:underline">
        Haberlere dön
      </Link>
    </div>
  );
}

function PostDetail() {
  const { slug } = Route.useParams();
  const { data: post } = useSuspenseQuery(postQuery(slug));
  if (!post) return <PostNotFound />;

  return (
    <article className="container-page max-w-3xl py-14">
      <Link
        to="/haberler"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Haberler
      </Link>
      <Badge variant="secondary" className="mt-6 capitalize">
        {post.category}
      </Badge>
      <h1 className="mt-3 text-3xl font-semibold leading-tight md:text-4xl">{post.title}</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        {formatDate(post.published_at ?? post.created_at)}
      </p>
      {post.cover_url ? (
        <img
          src={post.cover_url}
          alt={post.title}
          loading="lazy"
          className="mt-8 w-full rounded-xl object-cover shadow-card"
        />
      ) : null}
      {post.excerpt ? (
        <p className="mt-8 text-lg leading-relaxed text-muted-foreground">{post.excerpt}</p>
      ) : null}
      <RichText html={post.content} className="mt-6" />
      <ContentTaxonomy kind="post" id={post.id} className="mt-10 border-t border-border pt-6" />
    </article>
  );
}
