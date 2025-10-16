import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/auth";
import { getServerContainer } from "@/server/get-container";
import { adminPostCreateSchema, adminPostFilterSchema } from "@/server/validators/admin-post";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (session?.user.role !== "ADMIN") {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const searchParams = Object.fromEntries(request.nextUrl.searchParams.entries());
  const parseResult = adminPostFilterSchema.safeParse(searchParams);

  if (!parseResult.success) {
    return NextResponse.json({ error: "INVALID_QUERY", details: parseResult.error.flatten().fieldErrors }, { status: 400 });
  }

  const { services } = getServerContainer();
  const { status, page, pageSize } = parseResult.data;

  const result = await services.adminPost.list({ status }, { page, pageSize });

  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (session?.user.role !== "ADMIN") {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const json = await request.json().catch(() => null);
  const parseResult = adminPostCreateSchema.safeParse(json);

  if (!parseResult.success) {
    return NextResponse.json({ error: "INVALID_BODY", details: parseResult.error.flatten().fieldErrors }, { status: 400 });
  }

  const { services } = getServerContainer();

  try {
    const { publishedAt, ...restData } = parseResult.data;
    const normalizedPublishedAt =
      publishedAt === null
        ? null
        : publishedAt
        ? new Date(publishedAt)
        : undefined;

    const created = await services.adminPost.create({
      ...restData,
      ...(normalizedPublishedAt !== undefined ? { publishedAt: normalizedPublishedAt } : {}),
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("Admin post create failed", error);
    return NextResponse.json({ error: "CREATE_FAILED" }, { status: 400 });
  }
}
