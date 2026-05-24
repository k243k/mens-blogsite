// =============================================================================
// Edge Function: create-checkout-session
// ログイン済みユーザーが有料記事を単品購入するための Stripe Checkout を作成する。
//
// セキュリティ:
//  - JWT 必須（ログイン済みのみ）。
//  - Stripe secret key は Secrets(Deno.env) のみ。レスポンスに含めない。
//  - metadata に user_id / review_id を入れ、購入確定は Webhook 側でのみ行う。
// =============================================================================
import Stripe from "https://esm.sh/stripe@16?target=deno&no-check";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": Deno.env.get("ALLOWED_ORIGIN") ?? "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (b: Record<string, unknown>, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...CORS, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ status: "method_not_allowed" }, 405);

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const ANON = Deno.env.get("SUPABASE_ANON_KEY");
  const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const STRIPE_KEY = Deno.env.get("STRIPE_SECRET_KEY");
  const SITE_URL = Deno.env.get("SITE_URL") ?? "https://jiisan-estet.com";
  if (!SUPABASE_URL || !ANON || !SERVICE || !STRIPE_KEY) return json({ status: "not_configured" }, 503);

  // 1) JWT 検証
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return json({ status: "unauthorized" }, 401);
  const userClient = createClient(SUPABASE_URL, ANON, { global: { headers: { Authorization: authHeader } } });
  const { data: ud, error: ue } = await userClient.auth.getUser();
  if (ue || !ud.user) return json({ status: "unauthorized" }, 401);
  const user = ud.user;

  // 2) 入力 & 記事検証（service_role で公開・有料・価格を確認）
  let reviewId: string | null = null;
  try {
    reviewId = (await req.json()).reviewId ?? null;
  } catch { /* noop */ }
  if (!reviewId) return json({ status: "bad_request" }, 400);

  const admin = createClient(SUPABASE_URL, SERVICE);
  const { data: review } = await admin
    .from("reviews")
    .select("id, slug, title, is_paid, status, unit_price")
    .eq("id", reviewId)
    .single();
  if (!review || review.status !== "published" || !review.is_paid) {
    return json({ status: "not_purchasable" }, 400);
  }
  if (!review.unit_price || review.unit_price < 50) {
    return json({ status: "price_not_set" }, 400);
  }

  // 既に購入済みなら Checkout 不要
  const { data: existing } = await admin
    .from("purchases")
    .select("id")
    .eq("user_id", user.id)
    .eq("review_id", reviewId)
    .eq("payment_status", "paid")
    .maybeSingle();
  if (existing) return json({ status: "already_purchased" });

  // 3) Stripe Checkout 作成（Price事前作成不要の inline price_data）
  const stripe = new Stripe(STRIPE_KEY, {
    httpClient: Stripe.createFetchHttpClient(),
    apiVersion: "2024-06-20",
  });
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "jpy",
          unit_amount: review.unit_price,
          product_data: { name: `本音レビュー: ${review.title}` },
        },
        quantity: 1,
      },
    ],
    success_url: `${SITE_URL}/reviews/${review.slug}?purchased=1`,
    cancel_url: `${SITE_URL}/reviews/${review.slug}`,
    customer_email: user.email,
    metadata: { user_id: user.id, review_id: reviewId },
  });

  return json({ url: session.url });
});
