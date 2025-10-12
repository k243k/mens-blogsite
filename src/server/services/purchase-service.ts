import type { Stripe } from "stripe";

import type { PurchaseRepository } from "@/server/repositories/purchase-repository";

export class PurchaseService {
  constructor(private readonly purchaseRepository: PurchaseRepository) {}

  async recordStripePurchase(event: Stripe.Event) {
    if (event.type !== "checkout.session.completed") {
      return { handled: false as const };
    }

    const session = event.data.object as Stripe.Checkout.Session;
    if (!session.metadata?.postId || !session.metadata?.userId || !session.id) {
      return { handled: false as const };
    }

    const existing = await this.purchaseRepository.findByProviderSession(session.id);
    if (existing) {
      return { handled: true as const };
    }

    await this.purchaseRepository.createPurchase({
      postId: session.metadata.postId,
      userId: session.metadata.userId,
      providerSessionId: session.id,
    });

    return { handled: true as const };
  }
}
