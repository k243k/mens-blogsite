import { createStripeAdapter } from "@/server/adapters/stripe";
import { LocalStorageAdapter, createS3AdapterFromEnv } from "@/server/adapters/storage";
import { PrismaPostRepository } from "@/server/repositories/post-repository";
import { PrismaPostAdminRepository } from "@/server/repositories/post-admin-repository";
import { PrismaPurchaseRepository } from "@/server/repositories/purchase-repository";
import { PrismaSettingRepository } from "@/server/repositories/setting-repository";
import { PrismaCategoryRepository } from "@/server/repositories/category-repository";
import { PrismaTagRepository } from "@/server/repositories/tag-repository";
import { CheckoutService } from "@/server/services/checkout-service";
import { OwnershipService } from "@/server/services/ownership-service";
import { PurchaseService } from "@/server/services/purchase-service";
import { SearchService } from "@/server/services/search-service";
import { SettingService } from "@/server/services/setting-service";
import { AdminPostService } from "@/server/services/admin-post-service";
import { MediaService } from "@/server/services/media-service";
import { ContentService } from "@/server/services/content-service";
import { prisma } from "@/lib/prisma";

export type ServerContainer = ReturnType<typeof createServerContainer>;

export function createServerContainer() {
  const postRepository = new PrismaPostRepository(prisma);
  const purchaseRepository = new PrismaPurchaseRepository(prisma);
  const settingRepository = new PrismaSettingRepository(prisma);
  const postAdminRepository = new PrismaPostAdminRepository(prisma);
  const categoryRepository = new PrismaCategoryRepository(prisma);
  const tagRepository = new PrismaTagRepository(prisma);

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  const stripeAdapter = stripeSecretKey ? createStripeAdapter(stripeSecretKey) : null;

  const storageAdapter = createStorageAdapter();

  return {
    repositories: {
      post: postRepository,
      purchase: purchaseRepository,
      setting: settingRepository,
      postAdmin: postAdminRepository,
      category: categoryRepository,
      tag: tagRepository,
    },
    services: {
      search: new SearchService(postRepository),
      ownership: new OwnershipService(postRepository, purchaseRepository),
      checkout: stripeAdapter
        ? new CheckoutService(postRepository, purchaseRepository, stripeAdapter)
        : null,
      purchase: new PurchaseService(purchaseRepository),
      adminPost: new AdminPostService(postAdminRepository),
      settings: new SettingService(settingRepository),
      media: new MediaService(storageAdapter),
      content: new ContentService(postRepository, categoryRepository, tagRepository),
    },
    adapters: {
      stripe: stripeAdapter,
    },
  } as const;
}

function createStorageAdapter() {
  const driver = process.env.STORAGE_DRIVER?.toLowerCase() ?? "local";
  if (driver === "s3") {
    try {
      return createS3AdapterFromEnv();
    } catch (error) {
      console.error("Failed to initialize S3 storage adapter, falling back to local storage", error);
      return new LocalStorageAdapter();
    }
  }

  return new LocalStorageAdapter();
}
