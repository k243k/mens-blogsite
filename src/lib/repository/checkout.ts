import { getBrowserSupabase } from "@/lib/supabase/client";

/**
 * Stripe Checkout セッションを作成し、決済ページURLを返す（CSR専用）。
 *
 * ⚠️ Stripe secret は Edge Function 内のみ。クライアントは URL を受け取って遷移するだけ。
 * ⚠️ 購入確定は Webhook 経由のみ（このフローは決済ページへ送るだけで購入済みにしない）。
 */
export type CheckoutResult =
  | { kind: "redirect"; url: string }
  | { kind: "already_purchased" }
  | { kind: "error"; message: string };

export async function createCheckoutSession(reviewId: string): Promise<CheckoutResult> {
  const { data, error } = await getBrowserSupabase().functions.invoke("create-checkout-session", {
    body: { reviewId },
  });
  if (error) {
    return { kind: "error", message: "決済ページの作成に失敗しました。時間をおいて再度お試しください。" };
  }
  if (data?.status === "already_purchased") return { kind: "already_purchased" };
  if (data?.url) return { kind: "redirect", url: data.url as string };
  return { kind: "error", message: "現在この記事は購入できません。" };
}
