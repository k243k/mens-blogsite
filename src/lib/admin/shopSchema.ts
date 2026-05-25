import { z } from "zod";

/**
 * 店舗（shops）作成・編集フォームのバリデーション。
 * shops は areas に属し、reviews から参照される。書き込みは RLS で editor/admin 限定。
 */
export const shopFormSchema = z
  .object({
    name: z.string().trim().min(1, "店名は必須です").max(120),
    slug: z
      .string()
      .min(1, "slug は必須です")
      .regex(/^[a-z0-9-]+$/, "slug は英小文字・数字・ハイフンのみ"),
    areaId: z.string().uuid({ message: "エリアを選択してください" }),
    station: z.string().max(120).optional().nullable(),
    priceMin: z.number().int().nonnegative().nullable(),
    priceMax: z.number().int().nonnegative().nullable(),
    businessHours: z.string().max(200).optional().nullable(),
    officialUrl: z.string().url("URL形式で入力してください").optional().or(z.literal("")).nullable(),
    description: z.string().max(2000).optional().nullable(),
    caution: z.string().max(1000).optional().nullable(),
    status: z.enum(["published", "private"]),
  })
  .refine((v) => v.priceMin == null || v.priceMax == null || v.priceMax >= v.priceMin, {
    message: "料金の上限は下限以上にしてください",
    path: ["priceMax"],
  });

export type ShopFormValues = z.infer<typeof shopFormSchema>;

/** フォーム初期値。 */
export const emptyShopForm: ShopFormValues = {
  name: "",
  slug: "",
  areaId: "",
  station: "",
  priceMin: null,
  priceMax: null,
  businessHours: "",
  officialUrl: "",
  description: "",
  caution: "",
  status: "published",
};
