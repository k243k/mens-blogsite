import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { getServerContainer } from "@/server/get-container";
import { adminPostUpdateSchema } from "@/server/validators/admin-post";

const paramsSchema = z.object({
  id: z.string().cuid(),
});

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (session?.user.role !== "ADMIN") {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const parseParams = paramsSchema.safeParse(await context.params);
  if (!parseParams.success) {
    return NextResponse.json({ error: "INVALID_PARAMS" }, { status: 400 });
  }

  const { services } = getServerContainer();
  const post = await services.adminPost.getEditable(parseParams.data.id);

  if (!post) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  return NextResponse.json(post);
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (session?.user.role !== "ADMIN") {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const parseParams = paramsSchema.safeParse(await context.params);
  if (!parseParams.success) {
    return NextResponse.json({ error: "INVALID_PARAMS" }, { status: 400 });
  }

  const json = await request.json().catch(() => null);
  const parseResult = adminPostUpdateSchema.safeParse({ ...json, id: parseParams.data.id });

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

    const updated = await services.adminPost.update({
      ...restData,
      ...(normalizedPublishedAt !== undefined ? { publishedAt: normalizedPublishedAt } : {}),
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Admin post update failed", error);
    return NextResponse.json({ error: "UPDATE_FAILED" }, { status: 400 });
  }
}

export async function DELETE(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (session?.user.role !== "ADMIN") {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const parseParams = paramsSchema.safeParse(await context.params);
  if (!parseParams.success) {
    return NextResponse.json({ error: "INVALID_PARAMS" }, { status: 400 });
  }

  const { services } = getServerContainer();

  await services.adminPost.delete(parseParams.data.id);

  return NextResponse.json({ ok: true });
}
