import { NextRequest, NextResponse } from "next/server";

import { addComment, listComments } from "@/server/mock/comment-store";
import type { CommentStatus } from "@/server/types/comment";

export async function GET(request: NextRequest) {
  const postId = request.nextUrl.searchParams.get("postId");
  if (!postId) {
    return NextResponse.json({ error: "MISSING_POST_ID" }, { status: 400 });
  }

  const comments = listComments({ postId });
  return NextResponse.json({ comments });
}

export async function POST(request: NextRequest) {
  const json = await request.json().catch(() => null);
  if (!json || typeof json.postId !== "string" || typeof json.body !== "string") {
    return NextResponse.json({ error: "INVALID_BODY" }, { status: 400 });
  }

  const comment = {
    id: crypto.randomUUID(),
    postId: json.postId,
    body: json.body,
    status: "PENDING" as CommentStatus,
    createdAt: new Date().toISOString(),
  };

  addComment(comment);

  return NextResponse.json({
    message: "コメントを受け付けました（モデレーション待ち）。",
    comment,
  });
}
