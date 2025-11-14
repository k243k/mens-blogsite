import Link from "next/link";

import { formatDate, formatPriceJPY } from "@/lib/format";
import type { PostSummary } from "@/content/types";

function PaidBadge({ isPaid, price }: { isPaid: boolean; price: number }) {
  if (!isPaid) {
    return <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">無料</span>;
  }

  return (
    <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
      {formatPriceJPY(price)}
    </span>
  );
}

export function PostCard({ post }: { post: PostSummary }) {
  return (
    <article className="group flex h-full flex-col justify-between rounded-3xl border border-foreground/10 bg-background/90 p-6 shadow-sm shadow-black/5 transition hover:shadow-lg hover:shadow-black/10 dark:shadow-white/5">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-foreground/50">
          {formatDate(post.publishedAt)}
          <span className="h-1 w-1 rounded-full bg-foreground/30" aria-hidden />
          <span>{post.readTime}分で読了</span>
        </div>
        <Link href={`/posts/${post.slug}`} className="text-balance text-2xl font-semibold leading-tight text-foreground transition group-hover:text-emerald-500">
          {post.title}
        </Link>
        <p className="text-sm text-foreground/70">{post.excerpt}</p>
      </div>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <PaidBadge isPaid={post.isPaid} price={post.priceJPY} />
        <div className="flex flex-wrap gap-2 text-xs text-foreground/50">
          {post.categories.map((category) => (
            <Link key={category.slug} href={`/category/${category.slug}`} className="rounded-full border border-foreground/15 px-3 py-1 transition hover:border-emerald-400 hover:text-emerald-500">
              {category.name}
            </Link>
          ))}
        </div>
      </div>
    </article>
  );
}
