import { authors, categories, posts, tags } from "@/content/data";
import type {
  AdjacentPost,
  CategorySummary,
  Post,
  PostDetail,
  PostSummary,
  SearchFilters,
  SearchResult,
  TagSummary,
} from "@/content/types";

function toDate(value: string | null | undefined) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function getPublishedPosts(): Post[] {
  return posts.filter((post) => post.status === "published");
}

const categoryBySlug = new Map(categories.map((category) => [category.slug, category]));
const tagBySlug = new Map(tags.map((tag) => [tag.slug, tag]));
const authorById = new Map(authors.map((author) => [author.id, author]));

function toSummary(post: Post): PostSummary {
  return {
    id: post.id,
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt,
    publishedAt: toDate(post.publishedAt),
    isPaid: post.isPaid,
    priceJPY: post.priceJPY,
    readTime: post.readTime,
    coverImage: post.coverImage,
    categories: post.categories
      .map((slug) => categoryBySlug.get(slug))
      .filter(Boolean)
      .map((category) => ({ slug: category!.slug, name: category!.name })),
    tags: post.tags
      .map((slug) => tagBySlug.get(slug))
      .filter(Boolean)
      .map((tag) => ({ slug: tag!.slug, name: tag!.name })),
  };
}

function toDetail(post: Post): PostDetail {
  const author = authorById.get(post.authorId);

  return {
    ...toSummary(post),
    status: post.status,
    body: post.body,
    commentsEnabled: post.commentsEnabled,
    author: author ?? {
      id: "author-unknown",
      name: "Guest Author",
      email: "guest@example.com",
      role: "author",
    },
  };
}

function sortByPublishedDesc(items: Post[]) {
  return [...items].sort((a, b) => {
    const aTime = toDate(a.publishedAt)?.getTime() ?? 0;
    const bTime = toDate(b.publishedAt)?.getTime() ?? 0;
    return bTime - aTime;
  });
}

function normalizePagination(page?: number, pageSize?: number) {
  const safePage = Number.isFinite(page) && page ? Math.max(1, Math.floor(page)) : 1;
  const safePageSize = Number.isFinite(pageSize) && pageSize ? Math.max(1, Math.min(50, Math.floor(pageSize))) : 6;
  return { page: safePage, pageSize: safePageSize };
}

export function getHomeContent() {
  const published = getPublishedPosts();
  const sortedByDate = sortByPublishedDesc(published);
  const latest = sortedByDate.slice(0, 6).map(toSummary);
  const popular = [...published]
    .sort((a, b) => b.readTime - a.readTime)
    .slice(0, 6)
    .map(toSummary);

  return {
    latest,
    popular,
    categories: listCategories(8),
    tags: listTags(20),
  } as const;
}

export function getPostDetail(slug: string): PostDetail | null {
  const post = getPublishedPosts().find((item) => item.slug === slug);
  if (!post) {
    return null;
  }

  return toDetail(post);
}

export function getAdjacentPosts(slug: string): { previous: AdjacentPost | null; next: AdjacentPost | null } {
  const sorted = sortByPublishedDesc(getPublishedPosts());
  const index = sorted.findIndex((post) => post.slug === slug);
  if (index === -1) {
    return { previous: null, next: null };
  }

  const previous = sorted[index + 1];
  const next = sorted[index - 1];

  return {
    previous: previous
      ? {
          slug: previous.slug,
          title: previous.title,
        }
      : null,
    next: next
      ? {
          slug: next.slug,
          title: next.title,
        }
      : null,
  };
}

export function getRelatedPosts(slug: string, limit: number): PostSummary[] {
  const base = getPublishedPosts().find((post) => post.slug === slug);
  if (!base) {
    return [];
  }

  const related = getPublishedPosts()
    .filter((post) => post.slug !== slug && post.tags.some((tag) => base.tags.includes(tag)))
    .sort((a, b) => {
      const sharedTagsA = a.tags.filter((tag) => base.tags.includes(tag)).length;
      const sharedTagsB = b.tags.filter((tag) => base.tags.includes(tag)).length;
      if (sharedTagsA === sharedTagsB) {
        const aTime = toDate(a.publishedAt)?.getTime() ?? 0;
        const bTime = toDate(b.publishedAt)?.getTime() ?? 0;
        return bTime - aTime;
      }
      return sharedTagsB - sharedTagsA;
    })
    .slice(0, limit);

  return related.map(toSummary);
}

export function listCategories(limit?: number): CategorySummary[] {
  const published = getPublishedPosts();
  const counts = new Map<string, number>();

  for (const post of published) {
    for (const category of post.categories) {
      counts.set(category, (counts.get(category) ?? 0) + 1);
    }
  }

  const summaries = categories.map((category) => ({
    id: category.id,
    slug: category.slug,
    name: category.name,
    postCount: counts.get(category.slug) ?? 0,
  }));

  const sorted = summaries.sort((a, b) => b.postCount - a.postCount || a.name.localeCompare(b.name));
  return typeof limit === "number" ? sorted.slice(0, limit) : sorted;
}

export function listTags(limit?: number): TagSummary[] {
  const published = getPublishedPosts();
  const counts = new Map<string, number>();

  for (const post of published) {
    for (const tag of post.tags) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }

  const summaries = tags.map((tag) => ({
    id: tag.id,
    slug: tag.slug,
    name: tag.name,
    postCount: counts.get(tag.slug) ?? 0,
  }));

  const sorted = summaries.sort((a, b) => b.postCount - a.postCount || a.name.localeCompare(b.name));
  return typeof limit === "number" ? sorted.slice(0, limit) : sorted;
}

export function getCategorySummary(slug: string): CategorySummary | null {
  const category = categoryBySlug.get(slug);
  if (!category) return null;
  const stats = listCategories().find((item) => item.slug === slug);
  return stats ?? {
    id: category.id,
    slug: category.slug,
    name: category.name,
    postCount: 0,
  };
}

export function getTagSummary(slug: string): TagSummary | null {
  const tag = tagBySlug.get(slug);
  if (!tag) return null;
  const stats = listTags().find((item) => item.slug === slug);
  return stats ?? {
    id: tag.id,
    slug: tag.slug,
    name: tag.name,
    postCount: 0,
  };
}

export function searchPosts(filters: SearchFilters = {}, page = 1, pageSize = 8): SearchResult {
  const { page: safePage, pageSize: safePageSize } = normalizePagination(page, pageSize);
  const published = getPublishedPosts();

  const normalizedQuery = filters.query?.trim().toLowerCase();
  const filtered = published.filter((post) => {
    if (filters.categorySlug && !post.categories.includes(filters.categorySlug)) {
      return false;
    }
    if (filters.tagSlug && !post.tags.includes(filters.tagSlug)) {
      return false;
    }
    if (normalizedQuery) {
      const haystack = `${post.title} ${post.excerpt} ${post.body}`.toLowerCase();
      if (!haystack.includes(normalizedQuery)) {
        return false;
      }
    }
    return true;
  });

  const sorted = sortByPublishedDesc(filtered);
  const start = (safePage - 1) * safePageSize;
  const end = start + safePageSize;
  const items = sorted.slice(start, end).map(toSummary);

  return {
    items,
    total: filtered.length,
    page: safePage,
    pageSize: safePageSize,
  };
}

export function getAllPostSlugs(): string[] {
  return getPublishedPosts().map((post) => post.slug);
}

export function getAllCategories() {
  return listCategories();
}

export function getAllTags() {
  return listTags();
}

export function getAllPostSummaries(): PostSummary[] {
  return getPublishedPosts().map((post) => toSummary(post));
}
