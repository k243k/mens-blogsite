import Image from "next/image";
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

      <section className="grain relative isolate overflow-hidden">
        {/* 背景サンプル画像（差し替え前提）。ゆっくりパンしながら奥行きを出す */}
        <div aria-hidden="true" className="absolute inset-0 -z-10">
          <Image
            src="/samples/hero.jpg"
            alt=""
            fill
            priority
            sizes="100vw"
            className="slow-pan object-cover opacity-40"
          />
        </div>
        {/* 多層オーバーレイ（ゴールド／ワインの光＋下方向の暗がりで可読性確保） */}
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(circle at 18% 22%, rgba(210,166,121,0.20), transparent 40%), radial-gradient(circle at 86% 18%, rgba(143,29,44,0.22), transparent 38%), linear-gradient(180deg, rgba(13,11,10,0.55) 0%, rgba(13,11,10,0.82) 58%, #0d0b0a 100%)",
          }}
        />
        {/* 息づくゴールドの光 */}
        <div
          aria-hidden="true"
          className="glow-breathe absolute -left-24 top-8 -z-10 h-80 w-80 rounded-full bg-champagne-400/20 blur-3xl"
        />

        <div className="relative mx-auto max-w-[var(--container-lg)] px-5 py-28 sm:py-44">
          <p className="reveal delay-1 text-xs font-semibold tracking-[0.4em] text-champagne-400">
            MEN&apos;S ESTHE 本音レビュー
          </p>
          <div className="reveal delay-1 rule-gold mt-4 w-24" />
          <h1 className="font-display reveal delay-2 mt-6 max-w-3xl text-[2.7rem] leading-[1.16] text-ivory-100 sm:text-7xl">
            今夜、<span className="text-gold">外したくない</span>
            <br />
            メンズエステ体験談。
          </h1>
          <p className="reveal delay-3 mt-6 max-w-xl text-sm leading-8 text-ivory-300 sm:text-base">
            料金、雰囲気、清潔感、写真とのギャップまで。
            <br />
            行く前に知りたい本音だけを、静かに記録する。
          </p>
          <div className="reveal delay-4 mt-9 flex flex-wrap gap-3">
            <Button href="#areas" variant="primary">エリアから探す</Button>
            <Button href="/reviews" variant="secondary">高評価レビューを見る</Button>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[var(--container-lg)] px-5">
        <section id="areas" className="scroll-mt-20 py-16">
          <div className="rule-gold w-16" />
          <h2 className="font-display mt-4 text-3xl text-ivory-100 sm:text-4xl">エリアから探す</h2>
          <div className="mt-7 flex flex-wrap gap-3">
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

        <section className="py-8">
          <div className="flex items-end justify-between">
            <div>
              <div className="rule-gold w-16" />
              <h2 className="font-display mt-4 text-3xl text-ivory-100 sm:text-4xl">最新レビュー</h2>
            </div>
            <Link href="/reviews" className="text-sm text-champagne-300 transition hover:text-champagne-400">
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

        <section className="py-16">
          <div
            className="grain relative overflow-hidden rounded-[var(--radius-card)] border border-champagne-400/25 p-10 text-center shadow-card sm:p-14"
            style={{
              background:
                "linear-gradient(135deg, rgba(13,11,10,0.95), rgba(143,29,44,0.3)), radial-gradient(circle at 30% 10%, rgba(210,166,121,0.2), transparent 40%)",
            }}
          >
            <h2 className="font-display text-3xl text-ivory-100 sm:text-4xl">行く前に、外さないために。</h2>
            <p className="mx-auto mt-4 max-w-lg text-sm leading-7 text-ivory-300">
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
