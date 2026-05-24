import { notFound } from "next/navigation";
import Link from "next/link";

import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { ReviewCard } from "@/components/review/ReviewCard";
import { JsonLd, breadcrumbJsonLd } from "@/components/seo/JsonLd";
import { getAllAreas, getAreaBySlug, getReviewsByArea } from "@/lib/repository/public";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://jiisan-estet.com";

/**
 * 地域別レビュー一覧ページ。
 * 出典: design-spec §8 / requirements §5.4。無料公開情報のみ。
 */
export const dynamicParams = false;

export async function generateStaticParams() {
  const areas = await getAllAreas();
  return areas.map((a) => ({ areaSlug: a.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ areaSlug: string }> }) {
  const { areaSlug } = await params;
  const area = await getAreaBySlug(areaSlug);
  if (!area) return {};
  return {
    title: `${area.name}のメンズエステ体験レビュー`,
    description: area.description ?? `${area.name}エリアのメンズエステ体験レビュー一覧。`,
  };
}

export default async function AreaPage({ params }: { params: Promise<{ areaSlug: string }> }) {
  const { areaSlug } = await params;
  const area = await getAreaBySlug(areaSlug);
  if (!area) notFound();

  const reviews = await getReviewsByArea(areaSlug);

  return (
    <>
      <Header />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "トップ", url: `${SITE_URL}/` },
          { name: area.name, url: `${SITE_URL}/areas/${area.slug}` },
        ])}
      />
      <main className="mx-auto max-w-[var(--container-lg)] px-5 py-12">
        <nav className="mb-4 flex items-center gap-1.5 text-xs text-ivory-500">
          <Link href="/" className="hover:text-ivory-300">トップ</Link>
          <span>/</span>
          <span className="text-ivory-300">{area.name}</span>
        </nav>
        <h1 className="text-3xl font-bold text-ivory-100 sm:text-4xl">{area.name}のレビュー</h1>
        {area.description && <p className="mt-3 max-w-2xl text-sm leading-7 text-ivory-300">{area.description}</p>}

        {reviews.length === 0 ? (
          <p className="mt-10 text-sm text-ivory-500">このエリアの公開レビューはまだありません。</p>
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
