import { PrismaClient } from "@prisma/client";

export type CategorySummary = {
  id: string;
  name: string;
  slug: string;
  postCount: number;
};

export interface CategoryRepository {
  listWithCount(limit?: number): Promise<CategorySummary[]>;
  findBySlug(slug: string): Promise<CategorySummary | null>;
}

export class PrismaCategoryRepository implements CategoryRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async listWithCount(limit?: number) {
    const categories = await this.prisma.category.findMany({
      orderBy: { name: "asc" },
      take: limit,
      include: {
        _count: {
          select: { posts: true },
        },
      },
    });

    return categories.map((category) => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      postCount: category._count.posts,
    }));
  }

  async findBySlug(slug: string) {
    const category = await this.prisma.category.findUnique({
      where: { slug },
      include: {
        _count: {
          select: { posts: true },
        },
      },
    });

    if (!category) {
      return null;
    }

    return {
      id: category.id,
      name: category.name,
      slug: category.slug,
      postCount: category._count.posts,
    } satisfies CategorySummary;
  }
}
