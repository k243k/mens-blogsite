import { z } from "zod";

/**
 * 記事作成・編集フォームのバリデーション。
 * 有料本文フィールドは reviews ではなく review_paid_contents に保存する（混入禁止）。
 */
const scoreField = z
  .number({ invalid_type_error: "スコアを選択してください" })
  .min(1.0)
  .max(5.0)
  .nullable();

export const reviewFormSchema = z.object({
  // 基本情報
  shopId: z.string().uuid({ message: "店舗を選択してください" }),
  areaId: z.string().uuid({ message: "エリアを選択してください" }),
  title: z.string().min(1, "タイトルは必須です").max(120),
  slug: z
    .string()
    .min(1, "slug は必須です")
    .regex(/^[a-z0-9-]+$/, "slug は英小文字・数字・ハイフンのみ"),
  visitDate: z.string().optional().nullable(),
  price: z.number().int().nonnegative().nullable(),
  courseMinutes: z.number().int().nonnegative().nullable(),
  isPr: z.boolean(),
  status: z.enum(["draft", "published"]),

  // 無料本文
  summary: z.string().max(200).optional().nullable(),
  freeBody: z.string().min(1, "無料本文は必須です"),

  // 画像（URLのみ。Storage本体は後続Phase）
  thumbnailUrl: z.string().url().optional().or(z.literal("")).nullable(),
  mainImageUrl: z.string().url().optional().or(z.literal("")).nullable(),

  // スコア9指標
  overall: scoreField,
  sensual: scoreField,
  cleanliness: scoreField,
  service: scoreField,
  distance: scoreField,
  photoAccuracy: scoreField,
  beginner: scoreField,
  cost: scoreField,
  revisit: scoreField,

  // 有料本文（review_paid_contents へ）
  isPaid: z.boolean(),
  paidBody: z.string().optional().nullable(),
  photoGap: z.string().optional().nullable(),
  satisfaction: z.string().optional().nullable(),
  revisitOpinion: z.string().optional().nullable(),
  beginnerCaution: z.string().optional().nullable(),
  targetType: z.string().optional().nullable(),
}).refine(
  (v) => !v.isPaid || (v.paidBody !== null && v.paidBody !== undefined && v.paidBody.trim().length > 0),
  { message: "有料記事には有料本文が必須です", path: ["paidBody"] },
);

export type ReviewFormValues = z.infer<typeof reviewFormSchema>;

/** フォーム初期値。 */
export const emptyReviewForm: ReviewFormValues = {
  shopId: "",
  areaId: "",
  title: "",
  slug: "",
  visitDate: "",
  price: null,
  courseMinutes: null,
  isPr: false,
  status: "draft",
  summary: "",
  freeBody: "",
  thumbnailUrl: "",
  mainImageUrl: "",
  overall: null,
  sensual: null,
  cleanliness: null,
  service: null,
  distance: null,
  photoAccuracy: null,
  beginner: null,
  cost: null,
  revisit: null,
  isPaid: false,
  paidBody: "",
  photoGap: "",
  satisfaction: "",
  revisitOpinion: "",
  beginnerCaution: "",
  targetType: "",
};
