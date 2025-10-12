import type { CategoryRepository } from "@/server/repositories/category-repository";
import type { PostRepository } from "@/server/repositories/post-repository";
import type { TagRepository } from "@/server/repositories/tag-repository";
import type { PostDetail, PostSummary } from "@/server/types/post";

export class ContentService {
  constructor(
    private readonly postRepository: PostRepository,
    private readonly categoryRepository: CategoryRepository,
    private readonly tagRepository: TagRepository,
  ) {}

  async getHomeContent() {
    const [latest, popular, categories, tags] = await Promise.all([
      this.postRepository.listPublishedPosts({ orderBy: "latest", limit: 6 }),
      this.postRepository.listPublishedPosts({ orderBy: "popular", limit: 6 }),
      this.categoryRepository.listWithCount(8),
      this.tagRepository.listWithCount(20),
    ]);

    return { latest, popular, categories, tags } as const;
  }

  async getPostDetail(slug: string) {
    const post = await this.postRepository.findDetailedBySlug(slug);
    if (!post) {
      return null;
    }

    const [adjacent, related] = await Promise.all([
      this.postRepository.findAdjacentByPublishedAt(slug),
      this.postRepository.findRelatedPosts(post.id, 4),
    ]);

    return {
      post,
      adjacent,
      related,
    } satisfies {
      post: PostDetail;
      adjacent: { previous: { slug: string; title: string } | null; next: { slug: string; title: string } | null };
      related: PostSummary[];
    };
  }

  listCategories(limit?: number) {
    return this.categoryRepository.listWithCount(limit);
  }

  listTags(limit?: number) {
    return this.tagRepository.listWithCount(limit);
  }

  getCategory(slug: string) {
    return this.categoryRepository.findBySlug(slug);
  }

  getTag(slug: string) {
    return this.tagRepository.findBySlug(slug);
  }
}
