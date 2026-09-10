import "server-only";

import type { SubscriptionStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";

/** Agents without a paid subscription may keep one live listing. */
export const FREE_LISTING_LIMIT = 1;

const ACTIVE_STATUSES: SubscriptionStatus[] = ["active", "trialing"];

export async function getActiveSubscription(userId: string) {
  return prisma.subscription.findFirst({
    where: { userId, status: { in: ACTIVE_STATUSES } },
    include: { plan: true },
    orderBy: { createdAt: "desc" },
  });
}

export type ListingAllowance = {
  planId: string | null;
  planName: string;
  /** `null` means the plan has no cap. */
  limit: number | null;
  used: number;
  remaining: number | null;
  canCreate: boolean;
};

export async function getListingAllowance(userId: string): Promise<ListingAllowance> {
  const [subscription, used] = await Promise.all([
    getActiveSubscription(userId),
    prisma.property.count({
      where: { agentId: userId, status: { in: ["draft", "pending_review", "published"] } },
    }),
  ]);

  const limit = subscription ? subscription.plan.listingLimit : FREE_LISTING_LIMIT;

  return {
    planId: subscription?.planId ?? null,
    planName: subscription?.plan.name ?? "Free",
    limit,
    used,
    remaining: limit == null ? null : Math.max(0, limit - used),
    canCreate: limit == null || used < limit,
  };
}

export async function listSubscriptionsWithUsage() {
  const rows = await prisma.subscription.findMany({
    include: {
      plan: true,
      user: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const counts = await prisma.property.groupBy({
    by: ["agentId"],
    _count: { _all: true },
  });
  const usage = new Map(counts.map((c) => [c.agentId, c._count._all]));

  return rows.map((row) => ({
    id: row.id,
    status: row.status,
    currentPeriodEnd: row.currentPeriodEnd,
    planName: row.plan.name,
    priceMonthly: row.plan.priceMonthly,
    listingLimit: row.plan.listingLimit,
    userId: row.userId,
    userName: row.user.name ?? "Unknown",
    userEmail: row.user.email ?? "",
    listings: usage.get(row.userId) ?? 0,
  }));
}
