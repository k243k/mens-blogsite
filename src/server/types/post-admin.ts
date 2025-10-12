import type { PostStatus } from "@prisma/client";

export type PostAdminFilters = {
  status?: PostStatus;
  visibility?: "all" | "scheduled" | "published" | "draft";
};

export type PostAdminListItem = {
  id: string;
  slug: string;
  title: string;
  status: PostStatus;
  isPaid: boolean;
  priceJPY: number;
  publishedAt: Date | null;
  updatedAt: Date;
  author: {
    id: string;
    email: string;
  };
};

export type PostAdminCreateInput = {
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  status: PostStatus;
  publishedAt?: Date | null;
  isPaid: boolean;
  priceJPY: number;
  readTime: number;
  authorId: string;
  coverImage?: string | null;
  commentsEnabled: boolean;
  categoryIds: string[];
  tagIds: string[];
};

export type PostAdminUpdateInput = Partial<Omit<PostAdminCreateInput, "authorId">> & {
  id: string;
};

export type PostAdminEditable = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  status: PostStatus;
  publishedAt: Date | null;
  isPaid: boolean;
  priceJPY: number;
  readTime: number;
  coverImage: string | null;
  commentsEnabled: boolean;
  stripeProductId: string | null;
  stripePriceId: string | null;
  stripePriceAmount: number | null;
  categoryIds: string[];
  tagIds: string[];
  author: {
    id: string;
    email: string;
  };
  createdAt: Date;
  updatedAt: Date;
};
