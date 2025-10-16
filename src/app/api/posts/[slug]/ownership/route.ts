import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/auth";
import { getServerContainer } from "@/server/get-container";

export async function GET(_request: NextRequest, context: { params: Promise<{ slug: string }> }) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ hasAccess: false, reason: "UNAUTHENTICATED" as const }, { status: 401 });
  }

  const { services } = getServerContainer();
  const { slug } = await context.params;

  const result = await services.ownership.checkOwnership(session.user.id, slug);

  return NextResponse.json(result, { status: result.hasAccess ? 200 : 403 });
}
