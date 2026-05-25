import Link from "next/link";

import { ScoreBadge } from "@/components/ui/ScoreBadge";
import type { Review } from "@/lib/types";

// サムネ未設定時のサンプル画像（差し替え前提）。id から決定的に選ぶ。
const SAMPLE_IMAGES = ["/samples/card1-d.jpg", "/samples/card2-d.jpg", "/samples/card3-d.jpg"];
function sampleImageFor(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return SAMPLE_IMAGES[h % SAMPLE_IMAGES.length];
}

/**
 * 記事一覧用のレビューカード。
 * 黒×ゴールドの統一トーン・明朝タイトル・hoverで浮き＋画像ズーム。
 */
export function ReviewCard({ review }: { review: Review }) {
  const imageUrl = review.thumbnailUrl || sampleImageFor(review.id);

  return (
    <Link
      href={`/reviews/${review.slug}`}
      className="group block overflow-hidden rounded-[var(--radius-card)] border border-champagne-400/15 bg-night-900 shadow-card transition duration-300 hover:-translate-y-1 hover:border-champagne-400/40 hover:shadow-[0_30px_70px_rgba(0,0,0,0.5)]"
    >
      <div className="relative h-52 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt={review.title}
          referrerPolicy="no-referrer"
          loading="lazy"
          className="h-full w-full object-cover transition duration-700 ease-out group-hover:scale-[1.06]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-night-950 via-night-950/30 to-transparent" />

        <div className="absolute left-4 top-4 flex flex-wrap gap-2">
          <span className="rounded-full border border-white/10 bg-black/45 px-3 py-1 text-xs font-bold text-ivory-100 backdrop-blur">
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
          <h3 className="font-display line-clamp-2 text-xl leading-snug text-ivory-100 transition group-hover:text-champagne-300">
            {review.title}
          </h3>
          <p className="mt-2 text-sm text-ivory-300">
            {review.shopName}
            {review.price != null && `・${review.price.toLocaleString()}円`}
          </p>
        </div>

        <div className="rule-gold w-10" />

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
