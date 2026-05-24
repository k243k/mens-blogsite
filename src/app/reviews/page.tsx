import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { ReviewCard } from "@/components/review/ReviewCard";
import { getAllAreas, getAllPublishedReviews } from "@/lib/repository/public";

export const metadata = {
  title: "レビュー一覧",
  description: "メンズエステの体験レビュー一覧。エリア・料金・評価から探せます。",
};

/**
 * 記事一覧ページ。出典: design-spec §8.2 / requirements §5.2。
 * データはビルド時に Supabase から取得（無料情報のみ）。
 * フィルタの実動作は Phase 4 で実装（現状は見た目のチップ）。
 */
export default async function ReviewsPage() {
  const [reviews, areas] = await Promise.all([getAllPublishedReviews(), getAllAreas()]);
  const topAreas = areas.filter((a) => a.parentSlug === null);

  return (
    <>
      <Header />
      <main className="mx-auto max-w-[var(--container-lg)] px-5 py-12">
        <h1 className="text-3xl font-bold text-ivory-100 sm:text-4xl">レビュー一覧</h1>
        <p className="mt-2 text-sm text-ivory-300">
          行く前に知りたい本音を、エリア・料金・評価から。
        </p>

        <div className="mt-6 flex gap-2 overflow-x-auto pb-2">
          <span className="whitespace-nowrap rounded-full bg-champagne-400 px-4 py-2 text-xs font-bold text-night-950">
            すべて
          </span>
          {topAreas.map((area) => (
            <span
              key={area.slug}
              className="whitespace-nowrap rounded-full border border-champagne-400/25 bg-night-850 px-4 py-2 text-xs font-bold text-ivory-300"
            >
              {area.name}
            </span>
          ))}
        </div>

        {reviews.length === 0 ? (
          <p className="mt-10 text-sm text-ivory-500">公開中のレビューはまだありません。</p>
        ) : (
          <div className="mt-8 grid gap-6 [grid-template-columns:repeat(auto-fit,minmax(280px,1fr))]">
            {reviews.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
