import type { PostRepository } from "@/server/repositories/post-repository";
import type { PurchaseRepository } from "@/server/repositories/purchase-repository";

export class OwnershipService {
  constructor(
    private readonly postRepository: PostRepository,
    private readonly purchaseRepository: PurchaseRepository,
  ) {}

  async checkOwnership(userId: string, slug: string) {
    const post = await this.postRepository.findPublishedBySlug(slug);
    if (!post) {
      return { hasAccess: false, reason: "NOT_FOUND" as const };
    }

    if (!post.isPaid) {
      return { hasAccess: true, reason: "FREE_CONTENT" as const };
    }

    const purchase = await this.purchaseRepository.findByUserAndPost(userId, post.id);

    if (!purchase) {
      return { hasAccess: false, reason: "NOT_PURCHASED" as const };
    }

    return { hasAccess: true, reason: "PURCHASED" as const };
  }
}
