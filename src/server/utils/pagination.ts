import { PaginationParams } from "@/server/types/pagination";

const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 50;

export function normalizePagination(page?: number, pageSize?: number): PaginationParams {
  const safePage = Number.isFinite(page) && page && page > 0 ? Math.floor(page) : 1;
  const safeSize = Number.isFinite(pageSize) && pageSize && pageSize > 0 ? Math.min(Math.floor(pageSize), MAX_PAGE_SIZE) : DEFAULT_PAGE_SIZE;

  return {
    page: safePage,
    pageSize: safeSize,
  };
}

export function getSkipTake({ page, pageSize }: PaginationParams) {
  const skip = (page - 1) * pageSize;
  return { skip, take: pageSize };
}
