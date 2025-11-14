export type AuthorRole = "admin" | "author" | "reader";

export type Author = {
  id: string;
  name: string;
  email: string;
  role: AuthorRole;
};

export type Category = {
  id: string;
  slug: string;
  name: string;
  description?: string;
};

export type Tag = {
  id: string;
  slug: string;
  name: string;
  description?: string;
};

export type PostStatus = "draft" | "published";

export type Post = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  status: PostStatus;
  publishedAt: string;
  readTime: number;
  isPaid: boolean;
  priceJPY: number;
  coverImage: string | null;
  commentsEnabled: boolean;
  categories: string[];
  tags: string[];
  authorId: string;
  featured?: boolean;
};

export type PostSummary = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  publishedAt: Date | string | null;
  isPaid: boolean;
  priceJPY: number;
  readTime: number;
  coverImage: string | null;
  categories: { slug: string; name: string }[];
  tags: { slug: string; name: string }[];
};

export type PostDetail = PostSummary & {
  status: PostStatus;
  body: string;
  commentsEnabled: boolean;
  author: Author;
};

export type AdjacentPost = {
  slug: string;
  title: string;
};

export type CategorySummary = {
  id: string;
  slug: string;
  name: string;
  postCount: number;
};

export type TagSummary = {
  id: string;
  slug: string;
  name: string;
  postCount: number;
};

export type SearchFilters = {
  query?: string;
  categorySlug?: string;
  tagSlug?: string;
};

export type SearchResult = {
  items: PostSummary[];
  total: number;
  page: number;
  pageSize: number;
};

export type TocItem = {
  id: string;
  title: string;
  level: number;
};
