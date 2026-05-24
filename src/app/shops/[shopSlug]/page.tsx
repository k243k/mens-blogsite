import { notFound } from "next/navigation";
import Link from "next/link";

import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { ReviewCard } from "@/components/review/ReviewCard";
import { ScoreBadge } from "@/components/ui/ScoreBadge";
import { JsonLd, breadcrumbJsonLd } from "@/components/seo/JsonLd";
import { getAllShops, getReviewsByShop, getShopBySlug } from "@/lib/repository/public";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://jiisan-estet.com";

/**
 * 店舗詳細ページ。店舗情報＋紐づくレビュー一覧。
 * 出典: design-spec §8.4 / requirements §5.5。無料公開情報のみ。
 */
export const dynamicParams = false;

export async function generateStaticParams() {
  const shops = await getAllShops();
  return shops.map((s) => ({ shopSlug: s.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ shopSlug: string }> }) {
  const { shopSlug } = await params;
  const shop = await getShopBySlug(shopSlug);
  if (!shop) return {};
  return {
    title: `${shop.name}の体験レビュー`,
    description: shop.description ?? `${shop.name}のメンズエステ体験レビューと店舗情報。`,
  };
}

/** スコア平均（無料スコアのみ）。 */
function avgOverall(scores: number[]): string {
  const valid = scores.filter((n) => !Number.isNaN(n));
  if (valid.length === 0) return "—";
  return (valid.reduce((a, b) => a + b, 0) / valid.length).toFixed(1);
}

export default async function ShopPage({ params }: { params: Promise<{ shopSlug: string }> }) {
  const { shopSlug } = await params;
  const shop = await getShopBySlug(shopSlug);
  if (!shop) notFound();

  const reviews = await getReviewsByShop(shopSlug);
  const overallAvg = avgOverall(
    reviews.map((r) => r.scores.overall).filter((n): n is number => n != null),
  );

  return (
    <>
      <Header />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "トップ", url: `${SITE_URL}/` },
          { name: shop.name, url: `${SITE_URL}/shops/${shop.slug}` },
        ])}
      />
      <main className="mx-auto max-w-[var(--container-lg)] px-5 py-12">
        <nav className="mb-4 flex items-center gap-1.5 text-xs text-ivory-500">
          <Link href="/" className="hover:text-ivory-300">トップ</Link>
          <span>/</span>
          {shop.areaSlug && (
            <>
              <Link href={`/areas/${shop.areaSlug}`} className="hover:text-ivory-300">エリア</Link>
              <span>/</span>
            </>
          )}
          <span className="text-ivory-300">{shop.name}</span>
        </nav>

        <h1 className="text-3xl font-bold text-ivory-100 sm:text-4xl">{shop.name}</h1>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <ScoreBadge label="平均総合" value={overallAvg === "—" ? null : Number(overallAvg)} />
          <span className="text-sm text-ivory-500">レビュー {reviews.length} 件</span>
        </div>

        <section className="mt-6 rounded-[var(--radius-card)] border border-champagne-400/15 bg-night-900 p-6">
          <h2 className="text-lg font-bold text-ivory-100">店舗情報</h2>
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            {shop.station && <div><dt className="text-ivory-500">最寄駅</dt><dd className="text-ivory-100">{shop.station}</dd></div>}
            {shop.businessHours && <div><dt className="text-ivory-500">営業時間</dt><dd className="text-ivory-100">{shop.businessHours}</dd></div>}
            {shop.priceMin != null && (
              <div><dt className="text-ivory-500">料金帯</dt><dd className="text-ivory-100">{shop.priceMin.toLocaleString()}円〜{shop.priceMax?.toLocaleString()}円</dd></div>
            )}
            {shop.officialUrl && (
              <div><dt className="text-ivory-500">公式サイト</dt><dd><a href={shop.officialUrl} className="text-champagne-300 hover:text-champagne-400" target="_blank" rel="noopener noreferrer">公式サイト ↗</a></dd></div>
            )}
          </dl>
          {shop.description && <p className="mt-4 text-sm leading-7 text-ivory-300">{shop.description}</p>}
          {shop.caution && <p className="mt-3 text-xs text-ivory-500">※ {shop.caution}</p>}
        </section>

        <h2 className="mt-10 text-2xl font-bold text-ivory-100">この店舗のレビュー</h2>
        {reviews.length === 0 ? (
          <p className="mt-6 text-sm text-ivory-500">公開中のレビューはまだありません。</p>
        ) : (
          <div className="mt-6 grid gap-6 [grid-template-columns:repeat(auto-fit,minmax(280px,1fr))]">
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
