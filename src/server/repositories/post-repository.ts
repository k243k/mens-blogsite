import { Prisma, PrismaClient } from "@prisma/client";

import type { AdjacentPost, PostDetail, PostSummary } from "@/server/types/post";
import type { PaginationParams } from "@/server/types/pagination";
import type { SearchFilters, SearchPost } from "@/server/types/search";

export interface PostRepository {
  searchPublishedPosts(filters: SearchFilters, pagination: PaginationParams): Promise<{ items: SearchPost[]; total: number }>;
  findPublishedBySlug(slug: string): Promise<SearchPost | null>;
  findPublishedById(postId: string): Promise<SearchPost | null>;
  listPublishedPosts(options: { filters?: SearchFilters; limit?: number; orderBy?: "latest" | "popular" }): Promise<PostSummary[]>;
  findDetailedBySlug(slug: string): Promise<PostDetail | null>;
  findAdjacentByPublishedAt(slug: string): Promise<{ previous: AdjacentPost | null; next: AdjacentPost | null }>;
  findRelatedPosts(postId: string, limit: number): Promise<PostSummary[]>;
  updateStripeReferences(postId: string, data: { productId: string; priceId: string; amount: number }): Promise<void>;
}

export class PrismaPostRepository implements PostRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async searchPublishedPosts(filters: SearchFilters, pagination: PaginationParams) {
    const where = this.buildWhereClause(filters);
    const { skip, take } = this.getSkipTake(pagination);

    const [items, total] = await this.prisma.$transaction([
      this.prisma.post.findMany({
        where,
        skip,
        take,
        orderBy: { publishedAt: "desc" },
        select: this.summarySelection,
      }),
      this.prisma.post.count({ where }),
    ]);

    return {
      items: items.map((post) => this.mapToSummary(post)),
      total,
    };
  }

  async findPublishedBySlug(slug: string) {
    const post = await this.prisma.post.findFirst({
      where: {
        slug,
        status: "PUBLISHED",
        publishedAt: { lte: new Date() },
      },
      select: this.summarySelection,
    });

    return post ? this.mapToSummary(post) : null;
  }

  async findPublishedById(postId: string) {
    const post = await this.prisma.post.findFirst({
      where: {
        id: postId,
        status: "PUBLISHED",
        publishedAt: { lte: new Date() },
      },
      select: this.summarySelection,
    });

    return post ? this.mapToSummary(post) : null;
  }

  async listPublishedPosts(options: { filters?: SearchFilters; limit?: number; orderBy?: "latest" | "popular" }) {
    const { filters, limit, orderBy } = options;
    const where = this.buildWhereClause(filters ?? {});
    const order: Prisma.PostOrderByWithRelationInput =
      orderBy === "popular"
        ? { readTime: "desc" }
        : { publishedAt: "desc" };

    const posts = await this.prisma.post.findMany({
      where,
      take: limit,
      orderBy: order,
      select: this.summarySelection,
    });

    return posts.map((post) => this.mapToSummary(post));
  }

  async findDetailedBySlug(slug: string) {
    const post = await this.prisma.post.findFirst({
      where: {
        slug,
        status: "PUBLISHED",
        publishedAt: { lte: new Date() },
      },
      select: this.detailSelection,
    });

    if (!post) {
      return null;
    }

    return {
      id: post.id,
      slug: post.slug,
      title: post.title,
      excerpt: post.excerpt,
      publishedAt: post.publishedAt,
      isPaid: post.isPaid,
      priceJPY: post.priceJPY,
      readTime: post.readTime,
      categories: post.categories.map((item) => item.category),
      tags: post.tags.map((item) => item.tag),
      status: post.status,
      body: post.body,
      coverImage: post.coverImage,
      commentsEnabled: post.commentsEnabled,
      author: post.author,
    } satisfies PostDetail;
  }

  async findAdjacentByPublishedAt(slug: string) {
    const basePost = await this.prisma.post.findFirst({
      where: { slug },
      select: { publishedAt: true },
    });

    if (!basePost?.publishedAt) {
      return { previous: null, next: null };
    }

    const [previous, next] = await Promise.all([
      this.prisma.post.findFirst({
        where: {
          status: "PUBLISHED",
          publishedAt: { lt: basePost.publishedAt },
        },
        orderBy: { publishedAt: "desc" },
        select: { slug: true, title: true },
      }),
      this.prisma.post.findFirst({
        where: {
          status: "PUBLISHED",
          publishedAt: { gt: basePost.publishedAt },
        },
        orderBy: { publishedAt: "asc" },
        select: { slug: true, title: true },
      }),
    ]);

    return {
      previous: previous ?? null,
      next: next ?? null,
    };
  }

  async findRelatedPosts(postId: string, limit: number) {
    const tags = await this.prisma.postTag.findMany({
      where: { postId },
      select: { tagId: true },
    });

    if (!tags.length) {
      return [];
    }

    const related = await this.prisma.post.findMany({
      where: {
        id: { not: postId },
        status: "PUBLISHED",
        publishedAt: { lte: new Date() },
        tags: {
          some: {
            tagId: { in: tags.map((tag) => tag.tagId) },
          },
        },
      },
      orderBy: { publishedAt: "desc" },
      take: limit,
      select: this.summarySelection,
    });

    return related.map((post) => this.mapToSummary(post));
  }

  async updateStripeReferences(postId: string, data: { productId: string; priceId: string; amount: number }) {
    await this.prisma.post.update({
      where: { id: postId },
      data: {
        stripeProductId: data.productId,
        stripePriceId: data.priceId,
        stripePriceAmount: data.amount,
      },
    });
  }

  private buildWhereClause(filters: SearchFilters = {}) {
    const { query, categorySlug, tagSlug } = filters;

    return {
      status: "PUBLISHED" as const,
      publishedAt: { lte: new Date() },
      AND: [
        query
          ? {
              OR: [
                { title: { contains: query, mode: "insensitive" } },
                { excerpt: { contains: query, mode: "insensitive" } },
                { body: { contains: query, mode: "insensitive" } },
                {
                  tags: {
                    some: {
                      tag: { name: { contains: query, mode: "insensitive" } },
                    },
                  },
                },
              ],
            }
          : undefined,
        categorySlug
          ? {
              categories: {
                some: {
                  category: { slug: categorySlug },
                },
              },
            }
          : undefined,
        tagSlug
          ? {
              tags: {
                some: {
                  tag: { slug: tagSlug },
                },
              },
            }
          : undefined,
      ].filter(Boolean),
    } satisfies Prisma.PostWhereInput;
  }

  private readonly summarySelection = {
    id: true,
    slug: true,
    title: true,
    excerpt: true,
    publishedAt: true,
    isPaid: true,
    priceJPY: true,
    readTime: true,
    stripeProductId: true,
    stripePriceId: true,
    stripePriceAmount: true,
    categories: {
      select: {
        category: {
          select: {
            slug: true,
            name: true,
          },
        },
      },
    },
    tags: {
      select: {
        tag: {
          select: {
            slug: true,
            name: true,
          },
        },
      },
    },
  } satisfies Prisma.PostSelect;

  private readonly detailSelection = {
    ...this.summarySelection,
    body: true,
    coverImage: true,
    commentsEnabled: true,
    status: true,
    author: {
      select: {
        id: true,
        name: true,
        email: true,
      },
    },
  } satisfies Prisma.PostSelect;

  private mapToSummary(post: Prisma.PostGetPayload<{ select: typeof this.summarySelection }>): PostSummary {
    return {
      ...post,
      categories: post.categories.map((item) => item.category),
      tags: post.tags.map((item) => item.tag),
    } satisfies PostSummary;
  }

  private getSkipTake({ page, pageSize }: PaginationParams) {
    const skip = (page - 1) * pageSize;
    return { skip, take: pageSize };
  }
}
