import type { Buffer } from "node:buffer";
import { randomUUID } from "node:crypto";
import Stripe from "stripe";

export interface StripeAdapter {
  ensurePrice(params: StripePriceParams): Promise<{ priceId: string; productId: string }>;
  createCheckoutSession(params: StripeCheckoutSessionParams): Promise<Stripe.Checkout.Session>;
  retrieveCheckoutSession(sessionId: string): Promise<Stripe.Checkout.Session>;
  constructWebhookEvent(payload: string | Buffer, signature: string, secret: string): Stripe.Event;
}

export type StripePriceParams = {
  postId: string;
  title: string;
  amountJPY: number;
  productId?: string | null;
  priceId?: string | null;
  currentAmount?: number | null;
};

export type StripeCheckoutSessionParams = {
  priceId: string;
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
};

export class StripeSdkAdapter implements StripeAdapter {
  constructor(private readonly stripe: Stripe) {}

  async ensurePrice(params: StripePriceParams) {
    const existingProductId = params.productId ?? (await this.createProduct(params.title)).id;

    if (params.productId) {
      await this.stripedSafeUpdateProduct(existingProductId, params.title);
    }

    if (params.priceId && params.currentAmount === params.amountJPY) {
      return { priceId: params.priceId, productId: existingProductId };
    }

    const price = await this.stripe.prices.create({
      currency: "jpy",
      unit_amount: params.amountJPY,
      product: existingProductId,
    });

    return { priceId: price.id, productId: existingProductId };
  }

  async createCheckoutSession(params: StripeCheckoutSessionParams) {
    return this.stripe.checkout.sessions.create({
      mode: "payment",
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
      line_items: [
        {
          price: params.priceId,
          quantity: 1,
        },
      ],
      metadata: {
        ...params.metadata,
      },
    });
  }

  retrieveCheckoutSession(sessionId: string) {
    return this.stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["payment_intent"],
    });
  }

  constructWebhookEvent(payload: string | Buffer, signature: string, secret: string) {
    return this.stripe.webhooks.constructEvent(payload, signature, secret);
  }

  private async createProduct(name: string) {
    return this.stripe.products.create({ name });
  }

  private async stripedSafeUpdateProduct(productId: string, name: string) {
    try {
      await this.stripe.products.update(productId, { name });
    } catch (error) {
      console.warn("Failed to update Stripe product name", error);
    }
  }
}

export function createStripeAdapter(apiKey: string, apiVersion: Stripe.StripeConfig["apiVersion"] = "2024-06-20") {
  if (process.env.STRIPE_MOCK === "true") {
    return new MockStripeAdapter();
  }

  const stripe = new Stripe(apiKey, {
    apiVersion,
  });

  return new StripeSdkAdapter(stripe);
}

const mockSessions = new Map<string, Stripe.Checkout.Session>();

class MockStripeAdapter implements StripeAdapter {
  async ensurePrice(params: StripePriceParams) {
    const productId = params.productId ?? `prod_${params.postId}`;
    const priceId = params.priceId ?? `price_${params.postId}`;
    return { productId, priceId };
  }

  async createCheckoutSession(params: StripeCheckoutSessionParams) {
    const id = `cs_test_${randomUUID()}`;
    const url = params.successUrl.replace("{CHECKOUT_SESSION_ID}", id);
    const session = {
      id,
      object: "checkout.session",
      mode: "payment",
      url,
      payment_status: "paid",
      metadata: params.metadata ?? {},
    } as unknown as Stripe.Checkout.Session;
    mockSessions.set(id, session);
    return session;
  }

  async retrieveCheckoutSession(sessionId: string) {
    const session = mockSessions.get(sessionId);
    if (!session) {
      throw new Error("Mock Stripe session not found");
    }
    return session;
  }

  constructWebhookEvent() {
    throw new Error("Mock Stripe webhook not implemented");
  }
}
