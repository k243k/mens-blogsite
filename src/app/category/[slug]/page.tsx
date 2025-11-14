import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PostCard } from "@/components/posts/PostCard";
import { getAllCategories, getCategorySummary, searchPosts } from "@/content/api";

const MAX_ITEMS = 24;
export const revalidate = 120;
export const dynamicParams = false;

export async function generateStaticParams() {
  return getAllCategories().map((category) => ({ slug: category.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const category = getCategorySummary(slug);

  if (!category) {
    return {
      title: "カテゴリが見つかりません",
    };
  }

  return {
    title: `${category.name} の記事一覧 | Men's Blogsite`,
    description: `${category.name} に関する最新の体験談を紹介します。`,
  };
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const category = getCategorySummary(slug);

  if (!category) {
    notFound();
  }

  const result = searchPosts({ categorySlug: slug }, 1, Math.max(category.postCount, MAX_ITEMS));

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 pb-20 pt-16">
        <header className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-foreground/50">Category</p>
          <h1 className="text-3xl font-semibold">{category.name}</h1>
          <p className="text-sm text-foreground/60">{category.postCount} 件の記事が登録されています。</p>
        </header>

        <div className="grid gap-6 md:grid-cols-2">
          {result.items.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
          {!result.items.length ? <p className="text-sm text-foreground/60">まだ記事がありません。</p> : null}
        </div>
      </section>
    </main>
  );
}
