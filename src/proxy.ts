import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { homeForRole } from "@/server/roles";

export const proxy = auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;
  const role = session?.user?.role;

  const isDashboard = pathname.startsWith("/dashboard");
  const isAgency = pathname.startsWith("/agency");
  const isBroker = pathname.startsWith("/broker");
  const isSeller = pathname.startsWith("/seller");
  const isAdmin = pathname.startsWith("/admin");
  const isProtected = isDashboard || isAgency || isBroker || isSeller || isAdmin;

  if (isProtected && !session) {
    const login = new URL("/auth/login", req.nextUrl.origin);
    login.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(login);
  }

  if (isAdmin && role !== "ADMIN") {
    return NextResponse.redirect(new URL(homeForRole(role), req.nextUrl.origin));
  }

  if (isAgency && role !== "AGENCY" && role !== "ADMIN") {
    return NextResponse.redirect(new URL(homeForRole(role), req.nextUrl.origin));
  }

  if (isBroker && role !== "BROKER" && role !== "ADMIN") {
    return NextResponse.redirect(new URL(homeForRole(role), req.nextUrl.origin));
  }

  if (isSeller && role !== "SELLER" && role !== "ADMIN") {
    return NextResponse.redirect(new URL(homeForRole(role), req.nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/agency/:path*",
    "/broker/:path*",
    "/seller/:path*",
    "/admin/:path*",
  ],
};
