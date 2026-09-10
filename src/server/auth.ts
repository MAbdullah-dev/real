import { redirect } from "next/navigation";

import { auth } from "@/auth";
import type { Role } from "@prisma/client";

export async function getSession() {
  return auth();
}

export async function requireAuth() {
  const session = await auth();
  if (!session?.user) {
    redirect("/auth/login");
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
