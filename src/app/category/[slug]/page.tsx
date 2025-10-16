import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PostCard } from "@/components/posts/PostCard";
import { getServerContainer } from "@/server/get-container";

const PAGE_SIZE = 6;
export const revalidate = 120;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const {
    services: { content },
  } = getServerContainer();
  const category = await content.getCategory((await params).slug);

  if (!category) {
    return {
      title: "カテゴリが見つかりません",
    };
  }

  return {
    title: `${category.name} の記事一覧 | Men's Blogsite`,
    description: `${category.name} に関する最新の体験談を紹介します。`,
  } satisfies Metadata;
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams?: { page?: string };
}) {
  const container = getServerContainer();
  const category = await container.services.content.getCategory((await params).slug);

  if (!category) {
    notFound();
  }

  const currentPage = Math.max(Number(searchParams?.page ?? 1), 1);

  const result = await container.services.search.search(
    { categorySlug: (await params).slug },
    { page: currentPage, pageSize: PAGE_SIZE },
  );

  const totalPages = Math.max(Math.ceil(result.total / PAGE_SIZE), 1);

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

        <Pagination
          basePath={`/category/${(await params).slug}`}
          currentPage={currentPage}
          totalPages={totalPages}
        />
      </section>
    </main>
  );
}

function Pagination({ basePath, currentPage, totalPages }: { basePath: string; currentPage: number; totalPages: number }) {
  if (totalPages <= 1) return null;

  const prevDisabled = currentPage <= 1;
  const nextDisabled = currentPage >= totalPages;

  return (
    <nav className="flex items-center justify-center gap-4 text-sm" aria-label="ページネーション">
      <Link
        aria-disabled={prevDisabled}
        href={prevDisabled ? `${basePath}?page=${currentPage}` : `${basePath}?page=${currentPage - 1}`}
        className={`rounded-full border border-foreground/15 px-4 py-2 transition ${
          prevDisabled
            ? "pointer-events-none cursor-not-allowed text-foreground/40"
            : "hover:border-emerald-400 hover:text-emerald-500"
        }`}
      >
        前へ
      </Link>
      <span className="text-foreground/60">
        {currentPage} / {totalPages}
      </span>
      <Link
        aria-disabled={nextDisabled}
        href={nextDisabled ? `${basePath}?page=${currentPage}` : `${basePath}?page=${currentPage + 1}`}
        className={`rounded-full border border-foreground/15 px-4 py-2 transition ${
          nextDisabled
            ? "pointer-events-none cursor-not-allowed text-foreground/40"
            : "hover:border-emerald-400 hover:text-emerald-500"
        }`}
      >
        次へ
      </Link>
    </nav>
  );
}
