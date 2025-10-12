import type { PostRepository } from "@/server/repositories/post-repository";
import type { PaginationParams } from "@/server/types/pagination";
import type { SearchFilters, SearchResult } from "@/server/types/search";
import { normalizePagination } from "@/server/utils/pagination";

export class SearchService {
  constructor(private readonly postRepository: PostRepository) {}

  async search(filters: SearchFilters, pagination?: Partial<PaginationParams>): Promise<SearchResult> {
    const normalized = normalizePagination(pagination?.page, pagination?.pageSize);
    const { items, total } = await this.postRepository.searchPublishedPosts(filters, normalized);

    return {
      items,
      total,
      page: normalized.page,
      pageSize: normalized.pageSize,
    } satisfies SearchResult;
  }
}
