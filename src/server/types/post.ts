import type { PostStatus } from "@prisma/client";

export type PostSummary = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  publishedAt: Date | null;
  isPaid: boolean;
  priceJPY: number;
  readTime: number;
  stripeProductId?: string | null;
  stripePriceId?: string | null;
  stripePriceAmount?: number | null;
  categories: { slug: string; name: string }[];
  tags: { slug: string; name: string }[];
};

export type PostDetail = PostSummary & {
  status: PostStatus;
  body: string;
  coverImage: string | null;
  commentsEnabled: boolean;
  author: {
    id: string;
    name: string | null;
    email: string;
  };
};

export type AdjacentPost = {
  slug: string;
  title: string;
};

export type TocItem = {
  id: string;
  title: string;
  level: number;
};
