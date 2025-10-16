import { NextRequest, NextResponse } from "next/server";

import { getServerContainer } from "@/server/get-container";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "MISSING_SIGNATURE" }, { status: 400 });
  }

  const rawBody = await request.text();
  const { adapters, services } = getServerContainer();

  if (!adapters.stripe) {
    return NextResponse.json({ error: "STRIPE_NOT_CONFIGURED" }, { status: 503 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json({ error: "WEBHOOK_SECRET_NOT_SET" }, { status: 503 });
  }

  try {
    const event = adapters.stripe.constructWebhookEvent(rawBody, signature, webhookSecret);
    await services.purchase.recordStripePurchase(event);
  } catch (error) {
    console.error("Stripe webhook signature verification failed", error);
    return NextResponse.json({ error: "INVALID_SIGNATURE" }, { status: 400 });
  }

  return NextResponse.json({ received: true });
}
