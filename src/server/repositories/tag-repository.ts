import { PrismaClient } from "@prisma/client";

export type TagSummary = {
  id: string;
  name: string;
  slug: string;
  postCount: number;
};

export interface TagRepository {
  listWithCount(limit?: number): Promise<TagSummary[]>;
  findBySlug(slug: string): Promise<TagSummary | null>;
}

export class PrismaTagRepository implements TagRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async listWithCount(limit?: number) {
    const tags = await this.prisma.tag.findMany({
      orderBy: { name: "asc" },
      take: limit,
      include: {
        _count: {
          select: { posts: true },
        },
      },
    });

    return tags.map((tag) => ({
      id: tag.id,
      name: tag.name,
      slug: tag.slug,
      postCount: tag._count.posts,
    }));
  }

  async findBySlug(slug: string) {
    const tag = await this.prisma.tag.findUnique({
      where: { slug },
      include: {
        _count: {
          select: { posts: true },
        },
      },
    });

    if (!tag) {
      return null;
    }

    return {
      id: tag.id,
      name: tag.name,
      slug: tag.slug,
      postCount: tag._count.posts,
    } satisfies TagSummary;
  }
}
