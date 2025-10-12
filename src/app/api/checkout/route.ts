import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { getServerContainer } from "@/server/get-container";

const bodySchema = z.object({
  postId: z.string().cuid(),
  successUrl: z.string().url(),
  cancelUrl: z.string().url(),
});

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  }

  const json = await request.json().catch(() => null);
  const parseResult = bodySchema.safeParse(json);

  if (!parseResult.success) {
    return NextResponse.json(
      {
        error: "INVALID_BODY",
        details: parseResult.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  const { services } = getServerContainer();

  if (!services.checkout) {
    return NextResponse.json({ error: "CHECKOUT_UNAVAILABLE" }, { status: 503 });
  }

  const result = await services.checkout.createSessionForPost({
    userId: session.user.id,
    postId: parseResult.data.postId,
    successUrl: parseResult.data.successUrl,
    cancelUrl: parseResult.data.cancelUrl,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ url: result.session.url ?? undefined, sessionId: result.session.id });
}
