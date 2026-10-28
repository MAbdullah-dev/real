import "server-only";

import type { AgentStatus } from "@prisma/client";
import { redirect } from "next/navigation";

import { LISTING_LIMIT_STATUSES, SELLER_FREE_LISTING_LIMIT } from "@/data/plans";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/server/auth";

export async function createSellerProfileForUser(
  userId: string,
  opts?: { phone?: string }
) {
  return prisma.sellerProfile.create({
    data: {
      userId,
      phone: opts?.phone,
      status: "onboarding",
      onboardingStep: 0,
    },
  });
}

export async function getSellerProfile(userId: string) {
  return prisma.sellerProfile.findUnique({ where: { userId } });
}

export async function requireSeller() {
  const session = await requireRole(["SELLER", "ADMIN"]);
  if (session.user.role === "ADMIN") {
    const profile = await getSellerProfile(session.user.id);
    return { session, profile, isAdmin: true as const };
  }

  let profile = await getSellerProfile(session.user.id);
  if (!profile) {
    profile = await createSellerProfileForUser(session.user.id);
  }
  return { session, profile, isAdmin: false as const };
}

export function sellerConsoleAccess(status: AgentStatus | undefined) {
  if (status === "active") return "full" as const;
  if (status === "pending_review" || status === "suspended") return "readonly" as const;
  return "onboarding" as const;
}

export function sellerCanCreateDraft(status: AgentStatus) {
  return status === "active" || status === "pending_review";
}

export function sellerCanPublish(status: AgentStatus) {
  return status === "active";
}

export async function requireActiveSellerForWrite() {
  const ctx = await requireSeller();
  if (ctx.isAdmin) return ctx;
  if (!ctx.profile || !sellerCanCreateDraft(ctx.profile.status)) {
    redirect("/auth/onboarding/seller");
  }
  return ctx;
}

export async function getSellerListingAllowance(userId: string) {
  const used = await prisma.property.count({
    where: {
      sellerId: userId,
      status: { in: [...LISTING_LIMIT_STATUSES] },
    },
  });
  const limit = SELLER_FREE_LISTING_LIMIT;
  return {
    limit,
    used,
    remaining: Math.max(0, limit - used),
    canCreate: used < limit,
  };
}
