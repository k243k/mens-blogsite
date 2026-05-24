import Link from "next/link";

import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { ReviewCard } from "@/components/review/ReviewCard";
import { Button } from "@/components/ui/Button";
import { getAllAreas, getAllPublishedReviews } from "@/lib/repository/public";

/**
 * トップページ。
 * 出典: design-spec §8.1 / requirements §5.1。
 * データはビルド時に Supabase（public_reviews_for_build / areas）から取得（無料情報のみ）。
 */
export default async function HomePage() {
  const [reviews, areas] = await Promise.all([getAllPublishedReviews(), getAllAreas()]);
  const topAreas = areas.filter((a) => a.parentSlug === null);
  const latest = reviews.slice(0, 6);

  return (
    <>
      <Header />

      <section className="relative overflow-hidden">
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at 20% 20%, rgba(210,166,121,0.22), transparent 35%), radial-gradient(circle at 80% 30%, rgba(143,29,44,0.22), transparent 30%), linear-gradient(135deg, #0D0B0A, #181311 55%, #0D0B0A)",
          }}
        />
        <div className="relative mx-auto max-w-[var(--container-lg)] px-5 py-24 sm:py-32">
          <p className="text-xs font-semibold tracking-[0.25em] text-champagne-400">
            MEN&apos;S ESTHE 本音レビュー
          </p>
          <h1 className="mt-4 max-w-2xl text-4xl font-bold leading-tight text-ivory-100 sm:text-6xl">
            今夜、外したくない
            <br />
            メンズエステ体験談。
          </h1>
          <p className="mt-5 max-w-xl text-sm leading-7 text-ivory-300 sm:text-base">
            料金、雰囲気、清潔感、写真とのギャップまで。
            <br />
            行く前に知りたい本音を記録。
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button href="#areas" variant="primary">エリアから探す</Button>
            <Button href="/reviews" variant="secondary">高評価レビューを見る</Button>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[var(--container-lg)] px-5">
        <section id="areas" className="scroll-mt-20 py-14">
          <h2 className="text-2xl font-bold text-ivory-100">エリアから探す</h2>
          <div className="mt-6 flex flex-wrap gap-3">
            {topAreas.map((area) => (
              <Link
                key={area.slug}
                href={`/areas/${area.slug}`}
                className="rounded-full border border-champagne-400/25 bg-night-850 px-5 py-2.5 text-sm font-bold text-ivory-100 transition hover:border-champagne-400/50 hover:bg-champagne-400/10"
              >
                {area.name}
              </Link>
            ))}
          </div>
        </section>

        <section className="py-6">
          <div className="flex items-end justify-between">
            <h2 className="text-2xl font-bold text-ivory-100">最新レビュー</h2>
            <Link href="/reviews" className="text-sm text-champagne-300 hover:text-champagne-400">
              すべて見る →
            </Link>
          </div>
          {latest.length === 0 ? (
            <p className="mt-6 text-sm text-ivory-500">公開中のレビューはまだありません。</p>
          ) : (
            <div className="mt-6 grid gap-6 [grid-template-columns:repeat(auto-fit,minmax(280px,1fr))]">
              {latest.map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </div>
          )}
        </section>

        <section className="py-14">
          <div
            className="overflow-hidden rounded-[var(--radius-card)] border border-champagne-400/25 p-10 text-center"
            style={{
              background:
                "linear-gradient(135deg, rgba(13,11,10,0.95), rgba(143,29,44,0.3)), radial-gradient(circle at 30% 10%, rgba(210,166,121,0.2), transparent 40%)",
            }}
          >
            <h2 className="text-2xl font-bold text-ivory-100 sm:text-3xl">行く前に、外さないために。</h2>
            <p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-ivory-300">
              写真とのギャップ、再訪判断、初心者が注意すべき点。本音レビューで今夜の判断材料を。
            </p>
            <div className="mt-7 flex justify-center">
              <Button href="/reviews" variant="primary">本音レビューを読む</Button>
            </div>
          </div>
        </section>
      </div>

      <Footer />
    </>
  );
}
