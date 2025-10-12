import { PaginatedResult } from "@/server/types/pagination";
import type { PostSummary } from "@/server/types/post";

export type SearchFilters = {
  query?: string;
  categorySlug?: string;
  tagSlug?: string;
};

export type SearchPost = PostSummary;

export type SearchResult = PaginatedResult<SearchPost>;
