import type { MetadataRoute } from "next";

import { getAllAreas, getAllPublishedReviews, getAllShops } from "@/lib/repository/public";

// output: export では静的化を明示する必要がある（Next 16）。
export const dynamic = "force-static";

/**
 * サイトマップ。ビルド時に Supabase から公開記事・地域・店舗の URL を生成（無料公開情報のみ）。
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://jiisan-estet.com";
  const [reviews, areas, shops] = await Promise.all([
    getAllPublishedReviews(),
    getAllAreas(),
    getAllShops(),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/`, lastModified: new Date() },
    { url: `${baseUrl}/reviews`, lastModified: new Date() },
    { url: `${baseUrl}/legal/tokushoho`, lastModified: new Date() },
    { url: `${baseUrl}/privacy`, lastModified: new Date() },
    { url: `${baseUrl}/terms`, lastModified: new Date() },
  ];

  const reviewRoutes = reviews.map((r) => ({
    url: `${baseUrl}/reviews/${r.slug}`,
    lastModified: r.publishedAt ? new Date(r.publishedAt) : new Date(),
  }));
  const areaRoutes = areas.map((a) => ({ url: `${baseUrl}/areas/${a.slug}`, lastModified: new Date() }));
  const shopRoutes = shops.map((s) => ({ url: `${baseUrl}/shops/${s.slug}`, lastModified: new Date() }));

  return [...staticRoutes, ...reviewRoutes, ...areaRoutes, ...shopRoutes];
}
