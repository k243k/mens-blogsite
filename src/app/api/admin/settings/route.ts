import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { getServerContainer } from "@/server/get-container";

const bulkSchema = z.object({
  key: z.literal("bulk"),
  value: z.object({
    ads: z.object({
      articleTop: z.string().min(1),
      articleInline: z.string().min(1),
      articleBottom: z.string().min(1),
    }),
    seo: z.object({
      defaultTitle: z.string().min(1),
      defaultDescription: z.string().min(1),
    }),
    affiliate: z.object({
      utmSource: z.string().min(1),
      partnerId: z.string().min(1),
    }),
    comments: z.object({
      enabled: z.boolean(),
    }),
  }),
});

export async function GET() {
  const session = await auth();
  if (session?.user.role !== "ADMIN") {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const { services } = getServerContainer();
  const settings = await services.settings.getAll();

  return NextResponse.json({ settings });
}

export async function PUT(request: NextRequest) {
  const session = await auth();
  if (session?.user.role !== "ADMIN") {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const json = await request.json().catch(() => null);
  const parseResult = bulkSchema.safeParse(json);

  if (!parseResult.success) {
    return NextResponse.json({ error: "INVALID_BODY", details: parseResult.error.flatten().fieldErrors }, { status: 400 });
  }

  const { services } = getServerContainer();
  const value = parseResult.data.value;

  await Promise.all([
    services.settings.update("ads", value.ads),
    services.settings.update("seo", value.seo),
    services.settings.update("affiliate", value.affiliate),
    services.settings.update("comments", value.comments),
  ]);

  return NextResponse.json({ ok: true });
}
