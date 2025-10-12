import { PostStatus } from "@prisma/client";
import { z } from "zod";

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().optional(),
});

export const adminPostFilterSchema = paginationQuerySchema.extend({
  status: z.nativeEnum(PostStatus).optional(),
});

export const adminPostCreateSchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  excerpt: z.string().min(1),
  body: z.string().min(1),
  status: z.nativeEnum(PostStatus),
  publishedAt: z.union([z.string().datetime(), z.null()]).optional(),
  isPaid: z.coerce.boolean(),
  priceJPY: z.coerce.number().int().nonnegative(),
  readTime: z.coerce.number().int().nonnegative(),
  authorId: z.string().cuid(),
  coverImage: z.string().url().optional().nullable(),
  commentsEnabled: z.coerce.boolean().optional().default(false),
  categoryIds: z.array(z.string().cuid()).default([]),
  tagIds: z.array(z.string().cuid()).default([]),
});

export const adminPostUpdateSchema = adminPostCreateSchema
  .omit({
    authorId: true,
  })
  .partial()
  .extend({
    id: z.string().cuid(),
  });
