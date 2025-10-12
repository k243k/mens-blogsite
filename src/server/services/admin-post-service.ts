import { PostStatus } from "@prisma/client";

import type { PostAdminRepository } from "@/server/repositories/post-admin-repository";
import type {
  PostAdminCreateInput,
  PostAdminEditable,
  PostAdminFilters,
  PostAdminUpdateInput,
} from "@/server/types/post-admin";
import type { PaginationParams } from "@/server/types/pagination";
import { normalizePagination } from "@/server/utils/pagination";

export class AdminPostService {
  constructor(private readonly repository: PostAdminRepository) {}

  async list(filters: PostAdminFilters, pagination?: Partial<PaginationParams>) {
    const normalized = normalizePagination(pagination?.page, pagination?.pageSize);
    const { items, total } = await this.repository.list(filters, normalized);

    return {
      items,
      total,
      page: normalized.page,
      pageSize: normalized.pageSize,
    };
  }

  async create(input: PostAdminCreateInput) {
    const data = this.applyDefaultsOnCreate(input);
    return this.repository.create(data);
  }

  async update(input: PostAdminUpdateInput) {
    const data = this.applyDefaultsOnUpdate(input);
    return this.repository.update(data);
  }

  delete(id: string) {
    return this.repository.delete(id);
  }

  getById(id: string) {
    return this.repository.findById(id);
  }

  getEditable(id: string): Promise<PostAdminEditable | null> {
    return this.repository.findEditableById(id);
  }

  private applyDefaultsOnCreate(data: PostAdminCreateInput): PostAdminCreateInput {
    if (data.status === PostStatus.PUBLISHED && !data.publishedAt) {
      return { ...data, publishedAt: new Date() };
    }

    if (data.status === PostStatus.SCHEDULED && !data.publishedAt) {
      throw new Error("SCHEDULED_POST_REQUIRES_DATE");
    }

    return data;
  }

  private applyDefaultsOnUpdate(data: PostAdminUpdateInput): PostAdminUpdateInput {
    if (data.status === PostStatus.SCHEDULED && data.publishedAt === null) {
      throw new Error("SCHEDULED_POST_REQUIRES_DATE");
    }

    if (data.status === PostStatus.PUBLISHED && data.publishedAt === null) {
      return { ...data, publishedAt: new Date() };
    }

    return data;
  }
}
