import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import AdSlot from "@/components/ads/AdSlot";
import { PostCard } from "@/components/posts/PostCard";
import { TableOfContents } from "@/components/posts/TableOfContents";
import { getAdjacentPosts, getAllPostSlugs, getPostDetail, getRelatedPosts } from "@/content/api";
import type { PostDetail } from "@/content/types";
import { formatDate } from "@/lib/format";
import { renderMdxContent } from "@/lib/mdx";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const revalidate = 60;
export const dynamicParams = false;

export async function generateStaticParams() {
  return getAllPostSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const detail = getPostDetail(slug);

  if (!detail) {
    return {
      title: "記事が見つかりません",
    };
  }

  const url = `${SITE_URL}/posts/${detail.slug}`;
  const images = detail.coverImage ? [{ url: detail.coverImage }] : undefined;
  const publishedTime = detail.publishedAt ? new Date(detail.publishedAt).toISOString() : undefined;

  return {
    title: `${detail.title} | Men's Blogsite`,
    description: detail.excerpt,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: detail.title,
      description: detail.excerpt,
      url,
      type: "article",
      tags: detail.tags.map((tag) => tag.name),
      publishedTime,
      images,
    },
    twitter: {
      card: "summary_large_image",
      title: detail.title,
      description: detail.excerpt,
      images,
    },
  };
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const detail = getPostDetail(slug);

  if (!detail) {
    notFound();
  }

  const { content, headings } = await renderMdxContent(detail.body);
  const adjacent = getAdjacentPosts(slug);
  const related = getRelatedPosts(slug, 4);
  const metadataJsonLd = buildArticleJsonLd(detail, SITE_URL);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(metadataJsonLd) }}
      />
      <article className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-6 pb-24 pt-16 lg:flex-row">
        <div className="flex-1 space-y-10">
          <header className="space-y-4">
            <p className="text-sm font-medium uppercase tracking-[0.3em] text-emerald-500">{formatDate(detail.publishedAt)}</p>
            <h1 className="text-balance text-4xl font-semibold leading-tight sm:text-5xl">{detail.title}</h1>
            <p className="text-pretty text-base text-foreground/70">{detail.excerpt}</p>
            <div className="flex flex-wrap gap-3 text-xs text-foreground/60">
              <span>{detail.readTime}分で読了</span>
              <span className="h-1 w-1 rounded-full bg-foreground/30" aria-hidden />
              <span>{detail.categories.map((category) => category.name).join(" / ")}</span>
            </div>
          </header>

          <AdSlot id="article-top" className="h-24" />

          <div className="prose prose-zinc max-w-none prose-headings:scroll-mt-24 prose-p:leading-relaxed dark:prose-invert">
            {content}
          </div>

          <AdSlot id="article-bottom" className="h-24" />

          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">関連記事</h2>
            <div className="grid gap-6 md:grid-cols-2">
              {related.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
              {!related.length ? <p className="text-sm text-foreground/60">関連する記事はまだありません。</p> : null}
            </div>
          </section>
        </div>

        <aside className="flex w-full max-w-md flex-col gap-6">
          <TableOfContents items={headings} />
          <section className="rounded-2xl border border-foreground/10 bg-background/80 p-5 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-foreground/50">執筆者</h2>
            <p className="mt-2 text-base font-semibold">{detail.author.name}</p>
            <p className="mt-1 text-sm text-foreground/60">Men&apos;s Blogsite 編集部</p>
          </section>
          <section className="rounded-2xl border border-foreground/10 bg-background/80 p-5 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-foreground/50">次に読む</h2>
            <nav className="mt-3 space-y-3 text-sm text-foreground/70">
              {adjacent.previous ? (
                <Link href={`/posts/${adjacent.previous.slug}`} className="block rounded-lg border border-foreground/10 p-3 transition hover:border-emerald-400 hover:text-emerald-500">
                  ← {adjacent.previous.title}
                </Link>
              ) : null}
              {adjacent.next ? (
                <Link href={`/posts/${adjacent.next.slug}`} className="block rounded-lg border border-foreground/10 p-3 transition hover:border-emerald-400 hover:text-emerald-500">
                  → {adjacent.next.title}
                </Link>
              ) : null}
              {!adjacent.previous && !adjacent.next ? <p>ほかの記事も順次公開予定です。</p> : null}
            </nav>
          </section>
        </aside>
      </article>
    </main>
  );
}

function buildArticleJsonLd(post: PostDetail, baseUrl: string) {
  const url = `${baseUrl}/posts/${post.slug}`;
  const image = post.coverImage ? [post.coverImage] : undefined;

  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt,
    image,
    datePublished: post.publishedAt ? new Date(post.publishedAt).toISOString() : undefined,
    author: {
      "@type": "Person",
      name: post.author.name,
    },
    url,
    mainEntityOfPage: url,
    isAccessibleForFree: !post.isPaid,
  };
}
