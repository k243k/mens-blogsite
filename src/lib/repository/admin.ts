/**
 * 管理画面用 CRUD（CSR専用）。すべて anon key + ログインセッションで実行し、
 * 書き込み可否は DB の RLS（is_staff / 自著 / editor）で保証する。
 *
 * ⚠️ service_role key は使わない。
 * ⚠️ 有料本文は reviews ではなく review_paid_contents に保存する（物理分離）。
 */
import { getBrowserSupabase } from "@/lib/supabase/client";
import type { ReviewFormValues } from "@/lib/admin/reviewSchema";
import { shopFormSchema, type ShopFormValues } from "@/lib/admin/shopSchema";

export type AdminReviewRow = {
  id: string;
  title: string;
  slug: string;
  status: string;
  isPaid: boolean;
  updatedAt: string;
};

export type SelectOption = { id: string; label: string };

/** 店舗選択肢（エリアID・slug 付き。記事のエリア自動設定と slug 自動生成に使う）。 */
export type ShopOption = SelectOption & { areaId: string; slug: string };

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

/** 店舗選択肢（エリアID・slug 付き）。 */
export async function getShopOptions(): Promise<ShopOption[]> {
  const { data, error } = await getBrowserSupabase()
    .from("shops")
    .select("id,name,area_id,slug")
    .order("name");
  if (error) throw new Error(error.message);
  return (data ?? []).map((s) => ({
    id: s.id,
    label: s.name,
    areaId: s.area_id ?? "",
    slug: s.slug ?? "",
  }));
}

// ---------------------------------------------------------------------------
// 店舗（shops）管理 CRUD。書き込みは RLS（is_editor = editor/admin）で保証。
// ---------------------------------------------------------------------------

export type AdminShopRow = {
  id: string;
  name: string;
  slug: string;
  status: string;
  areaName: string | null;
};

/** 店舗一覧（管理用。エリア名を結合して表示）。 */
export async function getEditableShops(): Promise<AdminShopRow[]> {
  const { data, error } = await getBrowserSupabase()
    .from("shops")
    .select("id,name,slug,status,areas(name)")
    .order("name");
  if (error) throw new Error(error.message);
  return (data ?? []).map((s) => {
    // PostgREST の to-one 埋め込みはオブジェクト/配列いずれの形もありうる。
    const area = s.areas as { name: string } | { name: string }[] | null;
    const areaName = Array.isArray(area) ? (area[0]?.name ?? null) : (area?.name ?? null);
    return { id: s.id, name: s.name, slug: s.slug, status: s.status, areaName };
  });
}

/** 編集対象の店舗を読み込む。 */
export async function getShopForEdit(id: string): Promise<ShopFormValues | null> {
  const { data, error } = await getBrowserSupabase()
    .from("shops")
    .select(
      "name,slug,area_id,station,price_min,price_max,business_hours,official_url,description,caution,status",
    )
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  return {
    name: data.name,
    slug: data.slug,
    areaId: data.area_id,
    station: data.station ?? "",
    priceMin: data.price_min,
    priceMax: data.price_max,
    businessHours: data.business_hours ?? "",
    officialUrl: data.official_url ?? "",
    description: data.description ?? "",
    caution: data.caution ?? "",
    status: data.status === "private" ? "private" : "published",
  };
}

function shopRow(v: ShopFormValues) {
  // mutation 境界でも再バリデーション（クライアント関数は DevTools から直接呼べるため）。
  shopFormSchema.parse(v);
  return {
    name: v.name,
    slug: v.slug,
    area_id: v.areaId,
    station: v.station || null,
    price_min: v.priceMin,
    price_max: v.priceMax,
    business_hours: v.businessHours || null,
    official_url: v.officialUrl || null,
    description: v.description || null,
    caution: v.caution || null,
    status: v.status,
  };
}

/** shops の保存系エラーを利用者向け文言に変換する。 */
function shopWriteError(message: string): Error {
  if (/duplicate key|unique|23505/i.test(message)) {
    return new Error("この slug は既に使われています。別の slug にしてください。");
  }
  return new Error(message);
}

/** 店舗を新規作成。RLS が editor/admin 以外を拒否する。 */
export async function createShop(v: ShopFormValues): Promise<string> {
  const { data, error } = await getBrowserSupabase()
    .from("shops")
    .insert(shopRow(v))
    .select("id")
    .single();
  if (error) throw shopWriteError(error.message);
  return data.id as string;
}

/** 店舗を更新。 */
export async function updateShop(id: string, v: ShopFormValues): Promise<void> {
  const { error } = await getBrowserSupabase().from("shops").update(shopRow(v)).eq("id", id);
  if (error) throw shopWriteError(error.message);
}

/** 店舗を削除（参照中レビューがあると FK 制約で失敗するのでメッセージを補足）。 */
export async function deleteShop(id: string): Promise<void> {
  const { error } = await getBrowserSupabase().from("shops").delete().eq("id", id);
  if (error) {
    if (/foreign key|violates|23503/i.test(error.message)) {
      throw new Error("この店舗を参照しているレビューがあるため削除できません。先にレビューを削除/付け替えてください。");
    }
    throw new Error(error.message);
  }
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

/** 総合スコアは他8指標の平均で自動算出（小数第1位四捨五入）。入力欄は廃止。 */
function computeOverall(v: ReviewFormValues): number | null {
  const xs = [
    v.sensual,
    v.cleanliness,
    v.service,
    v.distance,
    v.photoAccuracy,
    v.beginner,
    v.cost,
    v.revisit,
  ].filter((x): x is number => x != null);
  if (xs.length === 0) return null;
  return Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 10) / 10;
}

function scoresRow(v: ReviewFormValues, reviewId: string) {
  return {
    review_id: reviewId,
    overall_score: computeOverall(v),
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

/** 店舗の area_id / slug を取得（エリア自動設定・slug自動生成の元データ）。 */
async function getShopMeta(shopId: string): Promise<{ areaId: string; slug: string }> {
  const { data, error } = await getBrowserSupabase()
    .from("shops")
    .select("area_id,slug")
    .eq("id", shopId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("選択された店舗が見つかりません。");
  return { areaId: data.area_id ?? "", slug: data.slug ?? "shop" };
}

/** 店舗slug + ランダム接尾辞で一意な記事slugを生成（手入力廃止）。衝突したら数回リトライ。 */
async function generateUniqueSlug(shopSlug: string): Promise<string> {
  const supabase = getBrowserSupabase();
  for (let i = 0; i < 6; i++) {
    const candidate = `${shopSlug}-${Math.random().toString(36).slice(2, 6)}`;
    const { data } = await supabase.from("reviews").select("id").eq("slug", candidate).maybeSingle();
    if (!data) return candidate;
  }
  // 万一すべて衝突したらタイムスタンプで確実に一意化。
  return `${shopSlug}-${Date.now().toString(36)}`;
}

/**
 * 新規作成。reviews → review_scores →（有料なら）review_paid_contents の順に保存。
 * RLS が writer/editor/admin 以外を拒否する。
 */
export async function createReview(v: ReviewFormValues): Promise<string> {
  const supabase = getBrowserSupabase();
  const authorId = await requireUserId();
  // エリアと slug はフォーム入力を廃止し、店舗から自動解決・自動生成する。
  const { areaId, slug } = await getShopMeta(v.shopId);
  const generatedSlug = await generateUniqueSlug(slug);
  const { data, error } = await supabase
    .from("reviews")
    .insert({ ...reviewRow(v, authorId), area_id: areaId, slug: generatedSlug })
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
  // 店舗変更に追従してエリアを再解決。slug は URL/SEO 維持のため既存値のまま（reviewRow が保持）。
  const { areaId } = await getShopMeta(v.shopId);
  const { error } = await supabase
    .from("reviews")
    .update({ ...reviewRow(v, authorId), area_id: areaId })
    .eq("id", id);
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
