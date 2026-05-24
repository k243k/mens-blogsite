/**
 * 管理画面用 CRUD（CSR専用）。すべて anon key + ログインセッションで実行し、
 * 書き込み可否は DB の RLS（is_staff / 自著 / editor）で保証する。
 *
 * ⚠️ service_role key は使わない。
 * ⚠️ 有料本文は reviews ではなく review_paid_contents に保存する（物理分離）。
 */
import { getBrowserSupabase } from "@/lib/supabase/client";
import type { ReviewFormValues } from "@/lib/admin/reviewSchema";

export type AdminReviewRow = {
  id: string;
  title: string;
  slug: string;
  status: string;
  isPaid: boolean;
  updatedAt: string;
};

export type SelectOption = { id: string; label: string };

/** 編集可能なレビュー一覧（RLSで author/editor の見える範囲）。 */
export async function getEditableReviews(): Promise<AdminReviewRow[]> {
  const { data, error } = await getBrowserSupabase()
    .from("reviews")
    .select("id,title,slug,status,is_paid,updated_at")
    .order("updated_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => ({
    id: r.id,
    title: r.title,
    slug: r.slug,
    status: r.status,
    isPaid: r.is_paid,
    updatedAt: r.updated_at,
  }));
}

/** エリア選択肢。 */
export async function getAreaOptions(): Promise<SelectOption[]> {
  const { data, error } = await getBrowserSupabase()
    .from("areas")
    .select("id,name")
    .order("display_order");
  if (error) throw new Error(error.message);
  return (data ?? []).map((a) => ({ id: a.id, label: a.name }));
}

/** 店舗選択肢。 */
export async function getShopOptions(): Promise<SelectOption[]> {
  const { data, error } = await getBrowserSupabase().from("shops").select("id,name").order("name");
  if (error) throw new Error(error.message);
  return (data ?? []).map((s) => ({ id: s.id, label: s.name }));
}

/** 編集対象を3テーブルから読み込む（有料本文は権限者のみRLSで取得可）。 */
export async function getReviewForEdit(id: string): Promise<ReviewFormValues | null> {
  const supabase = getBrowserSupabase();
  const { data: r, error } = await supabase
    .from("reviews")
    .select(
      "id,shop_id,area_id,title,slug,visit_date,price,course_minutes,summary,free_body,is_paid,is_pr,unit_price,status,thumbnail_url,main_image_url",
    )
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!r) return null;

  const { data: sc } = await supabase
    .from("review_scores")
    .select("*")
    .eq("review_id", id)
    .maybeSingle();

  // 有料本文は RLS で権限がなければ取得できない（取れなくても編集画面は無料部分のみ表示）
  const { data: paid } = await supabase
    .from("review_paid_contents")
    .select("body,photo_gap,satisfaction,revisit_opinion,beginner_caution,target_type")
    .eq("review_id", id)
    .maybeSingle();

  return {
    shopId: r.shop_id,
    areaId: r.area_id,
    title: r.title,
    slug: r.slug,
    visitDate: r.visit_date ?? "",
    price: r.price,
    courseMinutes: r.course_minutes,
    isPr: r.is_pr,
    status: r.status === "published" ? "published" : "draft",
    summary: r.summary ?? "",
    freeBody: r.free_body,
    thumbnailUrl: r.thumbnail_url ?? "",
    mainImageUrl: r.main_image_url ?? "",
    overall: sc?.overall_score ?? null,
    sensual: sc?.sensual_score ?? null,
    cleanliness: sc?.cleanliness_score ?? null,
    service: sc?.service_score ?? null,
    distance: sc?.distance_score ?? null,
    photoAccuracy: sc?.photo_accuracy_score ?? null,
    beginner: sc?.beginner_score ?? null,
    cost: sc?.cost_score ?? null,
    revisit: sc?.revisit_score ?? null,
    isPaid: r.is_paid,
    unitPrice: r.unit_price ?? null,
    paidBody: paid?.body ?? "",
    photoGap: paid?.photo_gap ?? "",
    satisfaction: paid?.satisfaction ?? "",
    revisitOpinion: paid?.revisit_opinion ?? "",
    beginnerCaution: paid?.beginner_caution ?? "",
    targetType: paid?.target_type ?? "",
  };
}

function reviewRow(v: ReviewFormValues, authorId: string) {
  return {
    shop_id: v.shopId,
    area_id: v.areaId,
    author_id: authorId,
    title: v.title,
    slug: v.slug,
    visit_date: v.visitDate || null,
    price: v.price,
    course_minutes: v.courseMinutes,
    summary: v.summary || null,
    free_body: v.freeBody,
    is_paid: v.isPaid,
    unit_price: v.isPaid ? v.unitPrice : null,
    is_pr: v.isPr,
    status: v.status,
    thumbnail_url: v.thumbnailUrl || null,
    main_image_url: v.mainImageUrl || null,
    published_at: v.status === "published" ? new Date().toISOString() : null,
  };
}

function scoresRow(v: ReviewFormValues, reviewId: string) {
  return {
    review_id: reviewId,
    overall_score: v.overall,
    sensual_score: v.sensual,
    cleanliness_score: v.cleanliness,
    service_score: v.service,
    distance_score: v.distance,
    photo_accuracy_score: v.photoAccuracy,
    beginner_score: v.beginner,
    cost_score: v.cost,
    revisit_score: v.revisit,
  };
}

function paidRow(v: ReviewFormValues, reviewId: string) {
  return {
    review_id: reviewId,
    body: v.paidBody ?? "",
    photo_gap: v.photoGap || null,
    satisfaction: v.satisfaction || null,
    revisit_opinion: v.revisitOpinion || null,
    beginner_caution: v.beginnerCaution || null,
    target_type: v.targetType || null,
  };
}

/** 現在ログイン中ユーザーIDをライブセッションから取得（渡された値に依存しない）。 */
async function requireUserId(): Promise<string> {
  const { data, error } = await getBrowserSupabase().auth.getUser();
  if (error || !data.user) throw new Error("ログインが必要です。");
  return data.user.id;
}

/**
 * 新規作成。reviews → review_scores →（有料なら）review_paid_contents の順に保存。
 * RLS が writer/editor/admin 以外を拒否する。
 */
export async function createReview(v: ReviewFormValues): Promise<string> {
  const supabase = getBrowserSupabase();
  const authorId = await requireUserId();
  const { data, error } = await supabase
    .from("reviews")
    .insert(reviewRow(v, authorId))
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  const reviewId = data.id as string;

  const { error: scErr } = await supabase.from("review_scores").insert(scoresRow(v, reviewId));
  if (scErr) throw new Error(scErr.message);

  if (v.isPaid) {
    const { error: pErr } = await supabase.from("review_paid_contents").insert(paidRow(v, reviewId));
    if (pErr) throw new Error(pErr.message);
  }
  return reviewId;
}

/** 更新。3テーブルを upsert する。 */
export async function updateReview(id: string, v: ReviewFormValues): Promise<void> {
  const supabase = getBrowserSupabase();
  const authorId = await requireUserId();
  const { error } = await supabase.from("reviews").update(reviewRow(v, authorId)).eq("id", id);
  if (error) throw new Error(error.message);

  const { error: scErr } = await supabase
    .from("review_scores")
    .upsert(scoresRow(v, id), { onConflict: "review_id" });
  if (scErr) throw new Error(scErr.message);

  if (v.isPaid) {
    const { error: pErr } = await supabase
      .from("review_paid_contents")
      .upsert(paidRow(v, id), { onConflict: "review_id" });
    if (pErr) throw new Error(pErr.message);
  } else {
    // 有料フラグを外したら有料本文を削除（残骸防止）
    await supabase.from("review_paid_contents").delete().eq("review_id", id);
  }
}
