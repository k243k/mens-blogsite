import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getServerContainer } from "@/server/get-container";

const querySchema = z.object({
  q: z.string().optional(),
  tag: z.string().optional(),
  category: z.string().optional(),
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().optional(),
});

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const parseResult = querySchema.safeParse(Object.fromEntries(url.searchParams.entries()));

  if (!parseResult.success) {
    return NextResponse.json(
      {
        error: "INVALID_QUERY",
        details: parseResult.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  const { services } = getServerContainer();
  const { q, category, tag, page, pageSize } = parseResult.data;

  const result = await services.search.search(
    {
      query: q,
      categorySlug: category,
      tagSlug: tag,
    },
    { page, pageSize },
  );

  return NextResponse.json(result);
}
