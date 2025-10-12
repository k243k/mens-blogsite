import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/auth";
import { getServerContainer } from "@/server/get-container";

type ConfirmBody = {
  sessionId: string;
};

const bodySchema = (value: unknown): value is ConfirmBody => {
  if (!value || typeof value !== "object") return false;
  if (!("sessionId" in value)) return false;
  return typeof (value as Record<string, unknown>).sessionId === "string";
};

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  }

  const json = await request.json().catch(() => null);
  if (!bodySchema(json)) {
    return NextResponse.json({ error: "INVALID_BODY" }, { status: 400 });
  }

  const container = getServerContainer();
  const result = await container.services.checkout.confirmSession(json.sessionId, session.user.id);

  if (!result.ok) {
    const status = mapErrorToStatus(result.error);
    return NextResponse.json({ error: result.error }, { status });
  }

  return NextResponse.json({ ok: true, alreadyOwned: result.alreadyOwned ?? false });
}

function mapErrorToStatus(error: string) {
  switch (error) {
    case "SESSION_NOT_FOUND":
      return 404;
    case "SESSION_METADATA_MISMATCH":
      return 403;
    case "SESSION_NOT_PAID":
      return 409;
    case "POST_NOT_FOUND":
      return 404;
    default:
      return 400;
  }
}
