import { Buffer } from "node:buffer";

import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/auth";
import { getServerContainer } from "@/server/get-container";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (session?.user.role !== "ADMIN") {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const formData = await request.formData().catch(() => null);
  if (!formData) {
    return NextResponse.json({ error: "INVALID_FORM" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "FILE_REQUIRED" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  const container = getServerContainer();

  try {
    const result = await container.services.media.upload({
      buffer,
      originalName: file.name,
      contentType: file.type,
      size: file.size,
    });

    return NextResponse.json({ url: result.url });
  } catch (error) {
    console.error("Media upload failed", error);
    const message = error instanceof Error ? error.message : "UPLOAD_FAILED";
    const status = message === "FILE_TOO_LARGE" ? 413 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
