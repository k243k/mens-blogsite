import Link from "next/link";

import { PlaceholderImage } from "@/components/ui/PlaceholderImage";
import { ScoreBadge } from "@/components/ui/ScoreBadge";
import type { Review } from "@/lib/types";

/**
 * 記事一覧用のレビューカード。
 * 出典: design-spec §7.3, §16。ダークブラウン背景・角丸大きめ・hoverで浮く。
 */
export function ReviewCard({ review }: { review: Review }) {
  return (
    <Link
      href={`/reviews/${review.slug}`}
      className="group block overflow-hidden rounded-[var(--radius-card)] border border-champagne-400/15 bg-night-900 shadow-card transition hover:-translate-y-0.5 hover:border-champagne-400/35"
    >
      <div className="relative">
        {review.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={review.thumbnailUrl} alt={review.title} className="h-52 w-full object-cover" />
        ) : (
          <PlaceholderImage variant="card" className="rounded-none border-0" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-night-950/90 via-night-950/20 to-transparent" />

        <div className="absolute left-4 top-4 flex flex-wrap gap-2">
          <span className="rounded-full bg-black/50 px-3 py-1 text-xs font-bold text-ivory-100 backdrop-blur">
            {review.areaName}
          </span>
          {review.isPaid && (
            <span className="rounded-full bg-champagne-400 px-3 py-1 text-xs font-bold text-night-950">
              本音レビュー
            </span>
          )}
          {review.isPr && (
            <span className="rounded-full bg-wine-700 px-3 py-1 text-xs font-bold text-ivory-100">
              PR
            </span>
          )}
        </div>
      </div>

      <div className="space-y-4 p-5">
        <div>
          <h3 className="line-clamp-2 text-lg font-bold leading-snug text-ivory-100 transition group-hover:text-champagne-300">
            {review.title}
          </h3>
          <p className="mt-2 text-sm text-ivory-300">
            {review.shopName}
            {review.price != null && `・${review.price.toLocaleString()}円`}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <ScoreBadge label="総合" value={review.scores.overall} />
          <ScoreBadge label="色気" value={review.scores.sensual} />
          <ScoreBadge label="再訪" value={review.scores.revisit} />
        </div>

        {review.summary && (
          <p className="line-clamp-3 text-sm leading-7 text-ivory-300">{review.summary}</p>
        )}
      </div>
    </Link>
  );
}
