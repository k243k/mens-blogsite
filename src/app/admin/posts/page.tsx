import Link from "next/link";

import { formatDate, formatPriceJPY } from "@/lib/format";
import { getServerContainer } from "@/server/get-container";
import { PostStatus } from "@prisma/client";

const PAGE_SIZE = 10;

const STATUS_LABEL: Record<PostStatus, string> = {
  [PostStatus.DRAFT]: "下書き",
  [PostStatus.PUBLISHED]: "公開中",
  [PostStatus.SCHEDULED]: "予約" ,
};

export default async function AdminPostsPage({
  searchParams,
}: {
  searchParams?: { page?: string; status?: string };
}) {
  const container = getServerContainer();
  const page = Math.max(Number(searchParams?.page ?? 1), 1);
  const rawStatus = searchParams?.status;
  const status = rawStatus && Object.values(PostStatus).includes(rawStatus as PostStatus)
    ? (rawStatus as PostStatus)
    : undefined;

  const result = await container.services.adminPost.list(
    { status },
    { page, pageSize: PAGE_SIZE },
  );

  const totalPages = Math.max(Math.ceil(result.total / PAGE_SIZE), 1);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">記事管理</h1>
          <p className="text-sm text-foreground/60">公開ステータスや公開日を確認しながら編集・作成できます。</p>
        </div>
        <Link
          href="/admin/posts/new"
          className="inline-flex items-center justify-center rounded-full bg-emerald-500 px-5 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600"
        >
          新規記事を作成
        </Link>
      </header>

      <div className="flex flex-wrap items-center gap-3 text-sm">
        <strong>{result.total}</strong> 件
        <StatusBadge status={status} />
        <FilterLinks currentStatus={status} />
      </div>

      <div className="overflow-hidden rounded-2xl border border-foreground/10 shadow-sm shadow-black/5 dark:shadow-white/5">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-foreground/5 text-xs uppercase tracking-widest text-foreground/60">
            <tr>
              <th className="px-4 py-3">タイトル</th>
              <th className="px-4 py-3">ステータス</th>
              <th className="px-4 py-3">公開日</th>
              <th className="px-4 py-3">読了/価格</th>
              <th className="px-4 py-3">アクション</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-foreground/10">
            {result.items.map((post) => (
              <tr key={post.id} className="transition hover:bg-foreground/5">
                <td className="px-4 py-4">
                  <Link href={`/admin/posts/${post.id}`} className="font-semibold text-foreground hover:text-emerald-500">
                    {post.title}
                  </Link>
                  <p className="text-xs text-foreground/50">{post.slug}</p>
                </td>
                <td className="px-4 py-4">
                  <span className="rounded-full bg-foreground/10 px-3 py-1 text-xs font-semibold text-foreground/70">
                    {STATUS_LABEL[post.status]}
                  </span>
                </td>
                <td className="px-4 py-4 text-sm text-foreground/70">{formatDate(post.publishedAt)}</td>
                <td className="px-4 py-4 text-xs text-foreground/60">
                  <div>{post.readTime}分</div>
                  <div>{post.isPaid ? formatPriceJPY(post.priceJPY) : "無料"}</div>
                </td>
                <td className="px-4 py-4 text-sm">
                  <div className="flex gap-2">
                    <Link
                      href={`/posts/${post.slug}`}
                      className="rounded-full border border-foreground/15 px-3 py-1 text-xs text-foreground/70 transition hover:border-emerald-400 hover:text-emerald-500"
                    >
                      公開ページ
                    </Link>
                    <Link
                      href={`/admin/posts/${post.id}`}
                      className="rounded-full border border-foreground/15 px-3 py-1 text-xs text-foreground/70 transition hover:border-emerald-400 hover:text-emerald-500"
                    >
                      編集
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
            {!result.items.length ? (
              <tr>
                <td className="px-4 py-6 text-center text-sm text-foreground/60" colSpan={5}>
                  記事が見つかりません。公開ステータスやページ番号を確認してください。
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <Pagination basePath="/admin/posts" currentPage={page} totalPages={totalPages} status={status} />
    </div>
  );
}

function StatusBadge({ status }: { status?: PostStatus }) {
  if (!status) {
    return (
      <span className="rounded-full border border-foreground/15 px-3 py-1 text-xs text-foreground/60">
        すべて
      </span>
    );
  }

  return (
    <span className="rounded-full border border-emerald-400 px-3 py-1 text-xs text-emerald-500">
      {STATUS_LABEL[status]}
    </span>
  );
}

function FilterLinks({ currentStatus }: { currentStatus?: PostStatus }) {
  const filters: { label: string; value?: PostStatus }[] = [
    { label: "すべて" },
    { label: "下書き", value: PostStatus.DRAFT },
    { label: "公開", value: PostStatus.PUBLISHED },
    { label: "予約", value: PostStatus.SCHEDULED },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {filters.map((filter) => {
        const active = currentStatus === filter.value || (!filter.value && !currentStatus);
        const params = new URLSearchParams();
        params.set("page", "1");
        if (filter.value) {
          params.set("status", filter.value);
        }
        const href = params.toString() ? `/admin/posts?${params.toString()}` : "/admin/posts";
        return (
          <Link
            key={filter.label}
            href={href}
            className={`rounded-full border px-3 py-1 text-xs transition ${
              active
                ? "border-emerald-400 bg-emerald-500/10 text-emerald-500"
                : "border-foreground/15 text-foreground/60 hover:border-emerald-400 hover:text-emerald-500"
            }`}
          >
            {filter.label}
          </Link>
        );
      })}
    </div>
  );
}

function Pagination({
  basePath,
  currentPage,
  totalPages,
  status,
}: {
  basePath: string;
  currentPage: number;
  totalPages: number;
  status?: PostStatus;
}) {
  if (totalPages <= 1) return null;

  const buildHref = (page: number) => {
    const params = new URLSearchParams();
    params.set("page", String(page));
    if (status) params.set("status", status);
    const query = params.toString();
    return query ? `${basePath}?${query}` : basePath;
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
