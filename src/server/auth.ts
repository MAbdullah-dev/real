import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { safeCallbackUrl } from "@/lib/callback-url";
import { homeForRole } from "@/server/roles";
import type { Role } from "@prisma/client";

export async function getSession() {
  return auth();
}

export async function requireAuth(callbackUrl?: string) {
  const session = await auth();
  if (!session?.user) {
    const next = safeCallbackUrl(callbackUrl);
    redirect(next ? `/auth/login?callbackUrl=${encodeURIComponent(next)}` : "/auth/login");
  }
  return session;
}

export async function requireRole(roles: Role[]) {
  const session = await requireAuth();
  if (!roles.includes(session.user.role)) {
    redirect("/");
  }
  return session;
}

/** Send an already-authenticated visitor to their workspace (or callback). */
export async function redirectIfSignedIn(callbackUrl?: string) {
  const session = await auth();
  if (!session?.user) return;
  redirect(safeCallbackUrl(callbackUrl) ?? homeForRole(session.user.role));
}
