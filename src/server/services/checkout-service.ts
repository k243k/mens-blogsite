import type { StripeAdapter } from "@/server/adapters/stripe";
import type { PostRepository } from "@/server/repositories/post-repository";
import type { PurchaseRepository } from "@/server/repositories/purchase-repository";

export class CheckoutService {
  constructor(
    private readonly postRepository: PostRepository,
    private readonly purchaseRepository: PurchaseRepository,
    private readonly stripe: StripeAdapter,
  ) {}

  async createSessionForPost(options: {
    userId: string;
    postId: string;
    successUrl: string;
    cancelUrl: string;
  }) {
    const post = await this.postRepository.findPublishedById(options.postId);
    if (!post) {
      return { ok: false as const, error: "POST_NOT_FOUND" as const };
    }

    if (!post.isPaid) {
      return { ok: false as const, error: "POST_IS_FREE" as const };
    }

    const existingPurchase = await this.purchaseRepository.findByUserAndPost(options.userId, post.id);
    if (existingPurchase) {
      return { ok: false as const, error: "ALREADY_PURCHASED" as const };
    }

    const priceInfo = await this.stripe.ensurePrice({
      postId: post.id,
      title: post.title,
      amountJPY: post.priceJPY,
      productId: post.stripeProductId,
      priceId: post.stripePriceId,
      currentAmount: post.stripePriceAmount,
    });

    if (
      post.stripeProductId !== priceInfo.productId ||
      post.stripePriceId !== priceInfo.priceId ||
      post.stripePriceAmount !== post.priceJPY
    ) {
      await this.postRepository.updateStripeReferences(post.id, {
        productId: priceInfo.productId,
        priceId: priceInfo.priceId,
        amount: post.priceJPY,
      });
    }

    const session = await this.stripe.createCheckoutSession({
      priceId: priceInfo.priceId,
      successUrl: appendSessionPlaceholder(options.successUrl),
      cancelUrl: options.cancelUrl,
      metadata: {
        userId: options.userId,
        postId: post.id,
      },
    });

    return { ok: true as const, session };
  }

  async confirmSession(sessionId: string, userId: string) {
    const session = await this.stripe.retrieveCheckoutSession(sessionId);

    if (!session || session.mode !== "payment") {
      return { ok: false as const, error: "SESSION_NOT_FOUND" as const };
    }

    if (session.payment_status !== "paid") {
      return { ok: false as const, error: "SESSION_NOT_PAID" as const };
    }

    const postId = session.metadata?.postId;
    const ownerId = session.metadata?.userId;

    if (!postId || ownerId !== userId) {
      return { ok: false as const, error: "SESSION_METADATA_MISMATCH" as const };
    }

    const post = await this.postRepository.findPublishedById(postId);
    if (!post) {
      return { ok: false as const, error: "POST_NOT_FOUND" as const };
    }

    const existingPurchase = await this.purchaseRepository.findByUserAndPost(userId, postId);
    if (existingPurchase) {
      return { ok: true as const, alreadyOwned: true as const };
    }

    await this.purchaseRepository.createPurchase({
      userId,
      postId,
      providerSessionId: session.id,
    });

    return { ok: true as const };
  }
}

function appendSessionPlaceholder(url: string) {
  const placeholder = "session_id={CHECKOUT_SESSION_ID}";
  if (url.includes("{CHECKOUT_SESSION_ID}")) {
    return url;
  }

  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}${placeholder}`;
}
