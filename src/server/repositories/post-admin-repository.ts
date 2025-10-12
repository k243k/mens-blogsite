import { Prisma, PrismaClient } from "@prisma/client";

import type {
  PostAdminCreateInput,
  PostAdminEditable,
  PostAdminFilters,
  PostAdminListItem,
  PostAdminUpdateInput,
} from "@/server/types/post-admin";
import type { PaginationParams } from "@/server/types/pagination";

export interface PostAdminRepository {
  list(filters: PostAdminFilters, pagination: PaginationParams): Promise<{ items: PostAdminListItem[]; total: number }>;
  create(data: PostAdminCreateInput): Promise<PostAdminListItem>;
  update(data: PostAdminUpdateInput): Promise<PostAdminListItem>;
  delete(id: string): Promise<void>;
  findById(id: string): Promise<PostAdminListItem | null>;
  findEditableById(id: string): Promise<PostAdminEditable | null>;
}

export class PrismaPostAdminRepository implements PostAdminRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async list(filters: PostAdminFilters, pagination: PaginationParams) {
    const where = this.buildWhere(filters);
    const { skip, take } = this.getSkipTake(pagination);

    const [items, total] = await this.prisma.$transaction([
      this.prisma.post.findMany({
        where,
        skip,
        take,
        orderBy: { updatedAt: "desc" },
        select: this.selection,
      }),
      this.prisma.post.count({ where }),
    ]);

    return {
      items: items.map(this.mapPost),
      total,
    };
  }

  async create(data: PostAdminCreateInput) {
    const created = await this.prisma.post.create({
      data: {
        slug: data.slug,
        title: data.title,
        excerpt: data.excerpt,
        body: data.body,
        status: data.status,
        publishedAt: data.publishedAt ?? null,
        isPaid: data.isPaid,
        priceJPY: data.priceJPY,
        readTime: data.readTime,
        author: { connect: { id: data.authorId } },
        coverImage: data.coverImage ?? null,
        commentsEnabled: data.commentsEnabled,
        categories: {
          create: data.categoryIds.map((categoryId) => ({ category: { connect: { id: categoryId } } })),
        },
        tags: {
          create: data.tagIds.map((tagId) => ({ tag: { connect: { id: tagId } } })),
        },
      },
      select: this.selection,
    });

    return this.mapPost(created);
  }

  async update(data: PostAdminUpdateInput) {
    const connections = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.post.update({
        where: { id: data.id },
        data: {
          slug: data.slug,
          title: data.title,
          excerpt: data.excerpt,
          body: data.body,
          status: data.status,
          publishedAt: data.publishedAt === undefined ? undefined : data.publishedAt,
          isPaid: data.isPaid,
          priceJPY: data.priceJPY,
          readTime: data.readTime,
          coverImage: data.coverImage,
          commentsEnabled: data.commentsEnabled,
          categories: data.categoryIds
            ? {
                deleteMany: {},
                create: data.categoryIds.map((categoryId) => ({ category: { connect: { id: categoryId } } })),
              }
            : undefined,
          tags: data.tagIds
            ? {
                deleteMany: {},
                create: data.tagIds.map((tagId) => ({ tag: { connect: { id: tagId } } })),
              }
            : undefined,
        },
        select: this.selection,
      });

      return updated;
    });

    return this.mapPost(connections);
  }

  async delete(id: string) {
    await this.prisma.post.delete({ where: { id } });
  }

  async findById(id: string) {
    const post = await this.prisma.post.findUnique({
      where: { id },
      select: this.selection,
    });

    return post ? this.mapPost(post) : null;
  }

  async findEditableById(id: string) {
    const post = await this.prisma.post.findUnique({
      where: { id },
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
      body: post.body,
      status: post.status,
      publishedAt: post.publishedAt,
      isPaid: post.isPaid,
      priceJPY: post.priceJPY,
      readTime: post.readTime,
      coverImage: post.coverImage,
      commentsEnabled: post.commentsEnabled,
      stripeProductId: post.stripeProductId ?? null,
      stripePriceId: post.stripePriceId ?? null,
      stripePriceAmount: post.stripePriceAmount ?? null,
      categoryIds: post.categories.map((item) => item.categoryId),
      tagIds: post.tags.map((item) => item.tagId),
      author: {
        id: post.author.id,
        email: post.author.email,
      },
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
    } satisfies PostAdminEditable;
  }

  private buildWhere(filters: PostAdminFilters): Prisma.PostWhereInput {
    if (!filters.status) {
      return {};
    }

    return {
      status: filters.status,
    } satisfies Prisma.PostWhereInput;
  }

  private readonly selection = {
    id: true,
    slug: true,
    title: true,
    status: true,
    isPaid: true,
    priceJPY: true,
    publishedAt: true,
    updatedAt: true,
    author: {
      select: {
        id: true,
        email: true,
      },
    },
  } satisfies Prisma.PostSelect;

  private readonly detailSelection = {
    id: true,
    slug: true,
    title: true,
    excerpt: true,
    body: true,
    status: true,
    publishedAt: true,
    isPaid: true,
    priceJPY: true,
    readTime: true,
    coverImage: true,
    commentsEnabled: true,
    createdAt: true,
    updatedAt: true,
    stripeProductId: true,
    stripePriceId: true,
    stripePriceAmount: true,
    author: {
      select: {
        id: true,
        email: true,
      },
    },
    categories: {
      select: {
        categoryId: true,
      },
    },
    tags: {
      select: {
        tagId: true,
      },
    },
  } satisfies Prisma.PostSelect;

  private mapPost(post: Prisma.PostGetPayload<{ select: typeof this.selection }>): PostAdminListItem {
    return {
      ...post,
    } satisfies PostAdminListItem;
  }

  private getSkipTake({ page, pageSize }: PaginationParams) {
    const skip = (page - 1) * pageSize;
    return { skip, take: pageSize };
  }
}
