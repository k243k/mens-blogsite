import { NextResponse } from "next/server";

import { auth } from "@/auth";

export default auth((req) => {
  const isAdminPath = req.nextUrl.pathname.startsWith("/admin");

  if (!isAdminPath) {
    return NextResponse.next();
  }

  const user = req.auth?.user;

  if (!user) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", req.nextUrl.href);
    return NextResponse.redirect(loginUrl);
  }

  if (user.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/", req.nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/admin/:path*"],
};
