// =============================================================================
// Edge Function: stripe-webhook
// Stripe の checkout.session.completed を受け、購入を確定する唯一の経路。
//
// セキュリティ:
//  - JWT 検証なし（Stripe からの呼び出し）。代わりに Stripe 署名で検証する。
//    → config.toml で verify_jwt = false。
//  - Webhook secret / service_role は Secrets のみ。
//  - provider_event_id / provider_payment_id の unique で冪等性を担保。
//  - purchases への書き込みはこの Function（service_role）のみ。
// =============================================================================
import Stripe from "https://esm.sh/stripe@16?target=deno&no-check";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  const STRIPE_KEY = Deno.env.get("STRIPE_SECRET_KEY");
  const WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!STRIPE_KEY || !WEBHOOK_SECRET || !SUPABASE_URL || !SERVICE) {
    return new Response(JSON.stringify({ status: "not_configured" }), { status: 503 });
  }

  const sig = req.headers.get("stripe-signature");
  if (!sig) return new Response("missing signature", { status: 400 });

  const stripe = new Stripe(STRIPE_KEY, {
    httpClient: Stripe.createFetchHttpClient(),
    apiVersion: "2024-06-20",
  });

  const body = await req.text();
  let event: Stripe.Event;
  try {
    // Deno では署名検証は async + SubtleCryptoProvider
    event = await stripe.webhooks.constructEventAsync(
      body,
      sig,
      WEBHOOK_SECRET,
      undefined,
      Stripe.createSubtleCryptoProvider(),
    );
  } catch (err) {
    // 署名不正。詳細は晒さない。
    return new Response(`invalid signature`, { status: 400 });
  }

  if (event.type !== "checkout.session.completed") {
    return new Response(JSON.stringify({ received: true, ignored: event.type }), { status: 200 });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  const userId = session.metadata?.user_id;
  const reviewId = session.metadata?.review_id;
  if (!userId || !reviewId || session.payment_status !== "paid") {
    return new Response(JSON.stringify({ received: true, skipped: true }), { status: 200 });
  }

  const admin = createClient(SUPABASE_URL, SERVICE);

  // 冪等 INSERT。provider_event_id / (user,review) / provider_payment_id の unique 衝突は無視。
  const { error } = await admin.from("purchases").insert({
    user_id: userId,
    review_id: reviewId,
    amount: session.amount_total ?? 0,
    currency: session.currency ?? "jpy",
    payment_provider: "stripe",
    payment_status: "paid",
    provider_payment_id: typeof session.payment_intent === "string" ? session.payment_intent : null,
    provider_event_id: event.id,
  });

  // 23505 = unique_violation（重複イベント/二重購入）→ 冪等として成功扱い
  if (error && error.code !== "23505") {
    // 一時的失敗は 500 で Stripe にリトライさせる（内容は晒さない）
    return new Response(JSON.stringify({ status: "retry" }), { status: 500 });
  }

  return new Response(JSON.stringify({ received: true }), { status: 200 });
});
