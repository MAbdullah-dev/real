import { NextResponse } from "next/server";

import { auth } from "@/auth";

function homeForRole(role?: string) {
  if (role === "ADMIN") return "/admin";
  if (role === "AGENT") return "/agent";
  return "/dashboard";
}

export const proxy = auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;
  const role = session?.user?.role;

  const isDashboard = pathname.startsWith("/dashboard");
  const isAgent = pathname.startsWith("/agent");
  const isAdmin = pathname.startsWith("/admin");
  const isProtected = isDashboard || isAgent || isAdmin;

  if (isProtected && !session) {
    const login = new URL("/auth/login", req.nextUrl.origin);
    login.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(login);
  }

  if (isAdmin && role !== "ADMIN") {
    return NextResponse.redirect(new URL(homeForRole(role), req.nextUrl.origin));
  }

  if (isAgent && role !== "AGENT" && role !== "ADMIN") {
    return NextResponse.redirect(new URL(homeForRole(role), req.nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/dashboard/:path*", "/agent/:path*", "/admin/:path*"],
};
