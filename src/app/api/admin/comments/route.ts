import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/auth";
import { listComments, updateCommentStatus } from "@/server/mock/comment-store";
import type { CommentStatus } from "@/server/types/comment";

export async function GET() {
  const session = await auth();
  if (session?.user.role !== "ADMIN") {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const comments = listComments();
  return NextResponse.json({ comments });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (session?.user.role !== "ADMIN") {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body.id !== "string" || !isStatus(body.status)) {
    return NextResponse.json({ error: "INVALID_BODY" }, { status: 400 });
  }

  const updated = updateCommentStatus(body.id, body.status);
  if (!updated) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  return NextResponse.json({ comment: updated });
}

function isStatus(value: unknown): value is CommentStatus {
  return value === "PENDING" || value === "APPROVED" || value === "REJECTED";
}
