/**
 * 公開（無料）データのリポジトリ層。静的生成（ビルド時）から使う。
 *
 * ⚠️ 取得元は `public_reviews_for_build` view（有料カラムを構造的に含まない）と
 *    published の areas / shops のみ。review_paid_contents には一切触れない。
 */
import { buildClient } from "@/lib/supabase/build";
import type { Area, Review, Shop } from "@/lib/types";

/** view の行（snake_case）。有料カラムは存在しない。 */
type BuildRow = {
  id: string;
  slug: string;
  title: string;
  visit_date: string | null;
  price: number | null;
  course_minutes: number | null;
  summary: string | null;
  free_body: string;
  is_paid: boolean;
  is_pr: boolean;
  unit_price: number | null;
  thumbnail_url: string | null;
  main_image_url: string | null;
  meta_title: string | null;
  meta_description: string | null;
  noindex: boolean;
  published_at: string | null;
  shop_slug: string | null;
  shop_name: string | null;
  area_slug: string | null;
  area_name: string | null;
  overall_score: number | null;
  sensual_score: number | null;
  cleanliness_score: number | null;
  service_score: number | null;
  distance_score: number | null;
  photo_accuracy_score: number | null;
  beginner_score: number | null;
  cost_score: number | null;
  revisit_score: number | null;
};

function toReview(r: BuildRow): Review {
  return {
    id: r.id,
    slug: r.slug,
    title: r.title,
    shopSlug: r.shop_slug ?? "",
    shopName: r.shop_name ?? "",
    areaSlug: r.area_slug ?? "",
    areaName: r.area_name ?? "",
    visitDate: r.visit_date,
    price: r.price,
    courseMinutes: r.course_minutes,
    summary: r.summary,
    freeBody: r.free_body,
    scores: {
      overall: r.overall_score,
      sensual: r.sensual_score,
      cleanliness: r.cleanliness_score,
      service: r.service_score,
      distance: r.distance_score,
      photoAccuracy: r.photo_accuracy_score,
      beginner: r.beginner_score,
      cost: r.cost_score,
      revisit: r.revisit_score,
    },
    isPaid: r.is_paid,
    isPr: r.is_pr,
    unitPrice: r.unit_price,
    thumbnailUrl: r.thumbnail_url,
    mainImageUrl: r.main_image_url,
    publishedAt: r.published_at,
  };
}

const REVIEW_COLUMNS =
  "id,slug,title,visit_date,price,course_minutes,summary,free_body,is_paid,is_pr,unit_price,thumbnail_url,main_image_url,meta_title,meta_description,noindex,published_at,shop_slug,shop_name,area_slug,area_name,overall_score,sensual_score,cleanliness_score,service_score,distance_score,photo_accuracy_score,beginner_score,cost_score,revisit_score";

/** 公開レビュー全件（新着順）。 */
export async function getAllPublishedReviews(): Promise<Review[]> {
  const { data, error } = await buildClient
    .from("public_reviews_for_build")
    .select(REVIEW_COLUMNS)
    .order("published_at", { ascending: false });
  if (error) throw new Error(`レビュー取得失敗: ${error.message}`);
  return (data as BuildRow[]).map(toReview);
}

/** slug で1件取得。 */
export async function getReviewBySlug(slug: string): Promise<Review | null> {
  const { data, error } = await buildClient
    .from("public_reviews_for_build")
    .select(REVIEW_COLUMNS)
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw new Error(`レビュー取得失敗: ${error.message}`);
  return data ? toReview(data as BuildRow) : null;
}

/** 地域 slug でレビュー一覧。 */
export async function getReviewsByArea(areaSlug: string): Promise<Review[]> {
  const { data, error } = await buildClient
    .from("public_reviews_for_build")
    .select(REVIEW_COLUMNS)
    .eq("area_slug", areaSlug)
    .order("published_at", { ascending: false });
  if (error) throw new Error(`地域レビュー取得失敗: ${error.message}`);
  return (data as BuildRow[]).map(toReview);
}

/** 店舗 slug でレビュー一覧。 */
export async function getReviewsByShop(shopSlug: string): Promise<Review[]> {
  const { data, error } = await buildClient
    .from("public_reviews_for_build")
    .select(REVIEW_COLUMNS)
    .eq("shop_slug", shopSlug)
    .order("published_at", { ascending: false });
  if (error) throw new Error(`店舗レビュー取得失敗: ${error.message}`);
  return (data as BuildRow[]).map(toReview);
}

// ---- areas / shops（published のみ。RLSで保証） ----

type AreaRow = {
  id: string;
  parent_id: string | null;
  name: string;
  slug: string;
  description: string | null;
};

type ShopRow = {
  id: string;
  area_id: string;
  name: string;
  slug: string;
  official_url: string | null;
  station: string | null;
  price_min: number | null;
  price_max: number | null;
  business_hours: string | null;
  description: string | null;
  caution: string | null;
};

/** 公開地域すべて（表示順）。 */
export async function getAllAreas(): Promise<Area[]> {
  const { data, error } = await buildClient
    .from("areas")
    .select("id,parent_id,name,slug,description")
    .order("display_order", { ascending: true });
  if (error) throw new Error(`地域取得失敗: ${error.message}`);
  return (data as AreaRow[]).map((a) => ({
    id: a.id,
    parentSlug: null, // 親slugは現状未使用（必要時にjoin）
    name: a.name,
    slug: a.slug,
    description: a.description,
  }));
}

/** 地域 slug で1件。 */
export async function getAreaBySlug(slug: string): Promise<Area | null> {
  const { data, error } = await buildClient
    .from("areas")
    .select("id,parent_id,name,slug,description")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw new Error(`地域取得失敗: ${error.message}`);
  if (!data) return null;
  const a = data as AreaRow;
  return { id: a.id, parentSlug: null, name: a.name, slug: a.slug, description: a.description };
}

function toShop(s: ShopRow, areaSlug: string): Shop {
  return {
    id: s.id,
    areaSlug,
    name: s.name,
    slug: s.slug,
    officialUrl: s.official_url,
    station: s.station,
    priceMin: s.price_min,
    priceMax: s.price_max,
    businessHours: s.business_hours,
    description: s.description,
    caution: s.caution,
  };
}

const SHOP_COLUMNS =
  "id,area_id,name,slug,official_url,station,price_min,price_max,business_hours,description,caution,areas(slug)";

/** 埋め込み area は配列/オブジェクトどちらの推論にもなりうるので正規化する。 */
type ShopJoinRow = ShopRow & { areas: { slug: string }[] | { slug: string } | null };

function areaSlugOf(row: ShopJoinRow): string {
  const a = row.areas;
  if (!a) return "";
  return Array.isArray(a) ? (a[0]?.slug ?? "") : a.slug;
}

/** 全公開店舗。 */
export async function getAllShops(): Promise<Shop[]> {
  const { data, error } = await buildClient.from("shops").select(SHOP_COLUMNS);
  if (error) throw new Error(`店舗取得失敗: ${error.message}`);
  return (data as unknown as ShopJoinRow[]).map((s) => toShop(s, areaSlugOf(s)));
}

/** 店舗 slug で1件。 */
export async function getShopBySlug(slug: string): Promise<Shop | null> {
  const { data, error } = await buildClient
    .from("shops")
    .select(SHOP_COLUMNS)
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw new Error(`店舗取得失敗: ${error.message}`);
  if (!data) return null;
  const s = data as unknown as ShopJoinRow;
  return toShop(s, areaSlugOf(s));
}
