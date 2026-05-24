/**
 * ドメイン型定義。
 * 出典: docs/specs/mens-esthe-review_requirements.md §8（DB設計）
 * 後で Supabase の行型に対応させる（snake_case ↔ camelCase はリポジトリ層で変換）。
 */

/** 公開ステータス。 */
export type PublishStatus = "draft" | "published" | "private";

/** 地域。 */
export type Area = {
  id: string;
  /** 親地域 slug（例: osaka）。トップレベルは null。 */
  parentSlug: string | null;
  name: string;
  slug: string;
  description: string | null;
};

/** 店舗。 */
export type Shop = {
  id: string;
  areaSlug: string;
  name: string;
  slug: string;
  officialUrl: string | null;
  station: string | null;
  priceMin: number | null;
  priceMax: number | null;
  businessHours: string | null;
  description: string | null;
  caution: string | null;
};

/** レビューの全スコア（9指標）。 */
export type ReviewScores = {
  overall: number | null;
  sensual: number | null;
  cleanliness: number | null;
  service: number | null;
  distance: number | null;
  photoAccuracy: number | null;
  beginner: number | null;
  cost: number | null;
  revisit: number | null;
};

/**
 * レビュー（無料公開情報のみ）。
 * ⚠️ 有料本文（paidBody）はこの型に含めない。
 *    有料本文は別型 ReviewPaidContent として、購入判定後に RPC 経由でのみ取得する。
 */
export type Review = {
  id: string;
  slug: string;
  title: string;
  shopSlug: string;
  shopName: string;
  areaSlug: string;
  areaName: string;
  visitDate: string | null;
  price: number | null;
  courseMinutes: number | null;
  /** 一言結論。 */
  summary: string | null;
  /** 無料本文（Markdown）。 */
  freeBody: string;
  scores: ReviewScores;
  isPaid: boolean;
  isPr: boolean;
  thumbnailUrl: string | null;
  mainImageUrl: string | null;
  publishedAt: string | null;
};

/**
 * 有料本文（物理分離）。
 * ⚠️ 静的成果物に絶対含めない。購入済みユーザーのみ RPC 経由で取得する。
 */
export type ReviewPaidContent = {
  reviewId: string;
  /** 有料本文（Markdown）。 */
  body: string;
};
