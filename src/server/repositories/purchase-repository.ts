import type { Purchase } from "@prisma/client";
import { PrismaClient } from "@prisma/client";

export interface PurchaseRepository {
  findByUserAndPost(userId: string, postId: string): Promise<Purchase | null>;
  findByProviderSession(providerSessionId: string): Promise<Purchase | null>;
  createPurchase(data: { userId: string; postId: string; providerSessionId: string }): Promise<Purchase>;
}

export class PrismaPurchaseRepository implements PurchaseRepository {
  constructor(private readonly prisma: PrismaClient) {}

  findByUserAndPost(userId: string, postId: string) {
    return this.prisma.purchase.findFirst({
      where: {
        userId,
        postId,
      },
    });
  }

  findByProviderSession(providerSessionId: string) {
    return this.prisma.purchase.findFirst({
      where: {
        providerSessionId,
      },
    });
  }

  createPurchase(data: { userId: string; postId: string; providerSessionId: string }) {
    return this.prisma.purchase.upsert({
      where: {
        providerSessionId: data.providerSessionId,
      },
      create: {
        ...data,
        provider: "stripe",
      },
      update: {
        userId: data.userId,
        postId: data.postId,
      },
    });
  }
}
