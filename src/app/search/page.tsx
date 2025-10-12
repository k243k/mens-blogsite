import Link from "next/link";

import { PostCard } from "@/components/posts/PostCard";
import AdSlot from "@/components/ads/AdSlot";
import { getServerContainer } from "@/server/get-container";

const PAGE_SIZE = 8;

export const revalidate = 60;

export default async function SearchPage({
  searchParams,
}: {
  searchParams?: {
    q?: string;
    category?: string;
    tag?: string;
    page?: string;
  };
}) {
  const container = getServerContainer();
  const query = searchParams?.q ?? "";
  const categorySlug = searchParams?.category ?? undefined;
  const tagSlug = searchParams?.tag ?? undefined;
  const currentPage = Math.max(Number(searchParams?.page ?? 1), 1);

  const [result, categories, tags] = await Promise.all([
    container.services.search.search(
      {
        query: query || undefined,
        categorySlug,
        tagSlug,
      },
      { page: currentPage, pageSize: PAGE_SIZE },
    ),
    container.services.content.listCategories(20),
    container.services.content.listTags(30),
  ]);

  const totalPages = Math.max(Math.ceil(result.total / PAGE_SIZE), 1);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 pb-24 pt-16">
        <header className="space-y-4">
          <h1 className="text-3xl font-semibold">記事検索</h1>
          <p className="text-sm text-foreground/70">キーワードやカテゴリ、タグを組み合わせて気になる記事を探しましょう。</p>
          <form className="flex flex-col gap-4 rounded-3xl border border-foreground/10 bg-background/80 p-6 shadow-sm shadow-black/5" method="get">
            <div>
              <label htmlFor="search-query" className="text-sm font-semibold text-foreground">
                キーワード
              </label>
              <input
                id="search-query"
                name="q"
                type="search"
                defaultValue={query}
                placeholder="例: 副業 スケジュール管理"
                className="mt-2 w-full rounded-xl border border-foreground/15 bg-background px-4 py-3 text-sm outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="search-category" className="text-sm font-semibold text-foreground">
                  カテゴリ
                </label>
                <select
                  id="search-category"
                  name="category"
                  defaultValue={categorySlug ?? ""}
                  className="mt-2 w-full rounded-xl border border-foreground/15 bg-background px-4 py-3 text-sm outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200"
                >
                  <option value="">すべて</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.slug}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="search-tag" className="text-sm font-semibold text-foreground">
                  タグ
                </label>
                <select
                  id="search-tag"
                  name="tag"
                  defaultValue={tagSlug ?? ""}
                  className="mt-2 w-full rounded-xl border border-foreground/15 bg-background px-4 py-3 text-sm outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200"
                >
                  <option value="">すべて</option>
                  {tags.map((tag) => (
                    <option key={tag.id} value={tag.slug}>
                      {tag.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-600"
              >
                検索する
              </button>
              <Link
                href="/search"
                className="inline-flex items-center justify-center rounded-full border border-foreground/20 px-5 py-3 text-sm font-semibold text-foreground transition hover:border-emerald-400 hover:text-emerald-500"
              >
                条件をリセット
              </Link>
            </div>
          </form>
        </header>

        <AdSlot id="search-top" className="h-24" />

        <section className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 text-sm text-foreground/60">
            <span>
              検索結果: <strong>{result.total}</strong> 件
            </span>
            <span>
              ページ: {currentPage} / {totalPages}
            </span>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {result.items.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
            {!result.items.length ? <p className="text-sm text-foreground/60">条件に合う記事が見つかりませんでした。</p> : null}
          </div>
        </section>

        <Pagination
          basePath="/search"
          currentPage={currentPage}
          totalPages={totalPages}
          query={query}
          category={categorySlug}
          tag={tagSlug}
        />
      </section>
    </main>
  );
}

function Pagination({
  basePath,
  currentPage,
  totalPages,
  query,
  category,
  tag,
}: {
  basePath: string;
  currentPage: number;
  totalPages: number;
  query: string;
  category?: string;
  tag?: string;
}) {
  if (totalPages <= 1) return null;

  const buildHref = (page: number) => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (category) params.set("category", category);
    if (tag) params.set("tag", tag);
    params.set("page", String(page));
    const queryString = params.toString();
    return queryString ? `${basePath}?${queryString}` : basePath;
  };

  const prevDisabled = currentPage <= 1;
  const nextDisabled = currentPage >= totalPages;

  return (
    <nav className="flex items-center justify-center gap-4 text-sm" aria-label="ページネーション">
      <Link
        aria-disabled={prevDisabled}
        href={prevDisabled ? buildHref(currentPage) : buildHref(currentPage - 1)}
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
        href={nextDisabled ? buildHref(currentPage) : buildHref(currentPage + 1)}
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
