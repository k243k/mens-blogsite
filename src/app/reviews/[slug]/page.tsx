import { notFound } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";

import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { PaidSection } from "@/components/review/PaidSection";
import { ScoreGrid } from "@/components/review/ScoreGrid";
import { JsonLd, articleJsonLd, breadcrumbJsonLd } from "@/components/seo/JsonLd";
import { PlaceholderImage } from "@/components/ui/PlaceholderImage";
import {
  getAllPublishedReviews,
  getReviewBySlug,
  getShopBySlug,
} from "@/lib/repository/public";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://jiisan-estet.com";

/**
 * 記事詳細ページ（無料部分のみ静的生成）。
 * 出典: design-spec §8.3 / requirements §5.3。
 *
 * ⚠️ 有料本文はこのページに含めない（PaidLockBox は文言とCTAのみ）。
 *    実本文取得は Phase 4（CSR + RPC get_review_paid_content）。
 */
// 公開記事が0件でも output: export を成立させる（事前生成したparamsのみ有効）。
export const dynamicParams = false;

export async function generateStaticParams() {
  const reviews = await getAllPublishedReviews();
  return reviews.map((r) => ({ slug: r.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const review = await getReviewBySlug(slug);
  if (!review) return {};
  return {
    title: review.title,
    description: review.summary ?? `${review.shopName}のメンズエステ体験レビュー。`,
  };
}

export default async function ReviewDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const review = await getReviewBySlug(slug);
  if (!review) notFound();

  const shop = review.shopSlug ? await getShopBySlug(review.shopSlug) : null;
  const pageUrl = `${SITE_URL}/reviews/${review.slug}`;

  return (
    <>
      <Header />

      <JsonLd
        data={breadcrumbJsonLd([
          { name: "トップ", url: `${SITE_URL}/` },
          { name: review.areaName, url: `${SITE_URL}/areas/${review.areaSlug}` },
          { name: review.title, url: pageUrl },
        ])}
      />
      <JsonLd
        data={articleJsonLd({
          title: review.title,
          description: review.summary ?? "",
          url: pageUrl,
          datePublished: review.publishedAt,
        })}
      />

      <main className="mx-auto max-w-[760px] px-5 py-10">
        <nav className="mb-5 flex flex-wrap items-center gap-1.5 text-xs text-ivory-500">
          <Link href="/" className="hover:text-ivory-300">トップ</Link>
          <span>/</span>
          <Link href={`/areas/${review.areaSlug}`} className="hover:text-ivory-300">{review.areaName}</Link>
          <span>/</span>
          <span className="text-ivory-300">レビュー</span>
        </nav>

        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-night-850 px-3 py-1 text-xs font-bold text-ivory-300">{review.areaName}</span>
          {review.isPaid && (
            <span className="rounded-full bg-champagne-400 px-3 py-1 text-xs font-bold text-night-950">本音レビュー</span>
          )}
          {review.isPr && (
            <span className="rounded-full bg-wine-700 px-3 py-1 text-xs font-bold text-ivory-100">PR</span>
          )}
        </div>
        <h1 className="mt-4 text-3xl font-bold leading-tight text-ivory-100 sm:text-4xl">{review.title}</h1>
        <p className="mt-3 text-sm text-ivory-300">
          {review.shopName}
          {review.price != null && `・${review.price.toLocaleString()}円`}
          {review.courseMinutes != null && `／${review.courseMinutes}分`}
          {review.visitDate && `・訪問 ${review.visitDate}`}
        </p>

        {review.isPr && (
          <p className="mt-4 rounded-[var(--radius-input)] border border-wine-700/40 bg-wine-700/10 px-4 py-2 text-xs text-ivory-300">
            PR：本記事には提供・広告を含む場合があります。
          </p>
        )}

        <div className="mt-6">
          {review.mainImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={review.mainImageUrl} alt={review.title} className="w-full rounded-[var(--radius-card)] object-cover" />
          ) : (
            <PlaceholderImage variant="shop" />
          )}
        </div>

        {review.summary && (
          <section className="mt-8 rounded-[var(--radius-card)] border border-champagne-400/25 bg-night-850 p-6">
            <p className="text-xs font-bold tracking-[0.18em] text-champagne-400">結論</p>
            <p className="mt-2 text-lg font-bold leading-relaxed text-ivory-100">{review.summary}</p>
          </section>
        )}

        <section className="mt-8">
          <h2 className="mb-4 text-xl font-bold text-ivory-100">スコア</h2>
          <ScoreGrid scores={review.scores} />
        </section>

        <section className="mt-8">
          <h2 className="mb-4 text-xl font-bold text-ivory-100">無料レビュー</h2>
          <div className="space-y-4 text-[15px] leading-8 text-ivory-100 [&>p]:mb-4">
            <ReactMarkdown>{review.freeBody}</ReactMarkdown>
          </div>
        </section>

        {review.isPaid && (
          <section className="mt-10">
            <PaidSection reviewId={review.id} />
          </section>
        )}

        {shop && (
          <section className="mt-10 rounded-[var(--radius-card)] border border-champagne-400/15 bg-night-900 p-6">
            <h2 className="text-xl font-bold text-ivory-100">店舗情報</h2>
            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              <div><dt className="text-ivory-500">店舗名</dt><dd className="text-ivory-100">{shop.name}</dd></div>
              {shop.station && <div><dt className="text-ivory-500">最寄駅</dt><dd className="text-ivory-100">{shop.station}</dd></div>}
              {shop.businessHours && <div><dt className="text-ivory-500">営業時間</dt><dd className="text-ivory-100">{shop.businessHours}</dd></div>}
              {shop.priceMin != null && (
                <div><dt className="text-ivory-500">料金帯</dt><dd className="text-ivory-100">{shop.priceMin.toLocaleString()}円〜{shop.priceMax?.toLocaleString()}円</dd></div>
              )}
            </dl>
            <Link href={`/shops/${shop.slug}`} className="mt-4 inline-block text-sm text-champagne-300 hover:text-champagne-400">
              この店舗の全レビューを見る →
            </Link>
            {shop.caution && <p className="mt-4 text-xs text-ivory-500">※ {shop.caution}</p>}
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}
