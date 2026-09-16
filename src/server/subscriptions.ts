import "server-only";

import type { SubscriptionStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { getMembership } from "@/server/agency";

/** Agencies without a paid subscription may keep one live listing. */
export const FREE_LISTING_LIMIT = 1;

const ACTIVE_STATUSES: SubscriptionStatus[] = ["active", "trialing"];

export async function getActiveSubscriptionForAgency(agencyId: string) {
  return prisma.subscription.findFirst({
    where: { agencyId, status: { in: ACTIVE_STATUSES } },
    include: { plan: true },
    orderBy: { createdAt: "desc" },
  });
}

/** Resolve the caller's agency subscription via membership. */
export async function getActiveSubscription(userId: string) {
  const membership = await getMembership(userId);
  if (!membership) return null;
  return getActiveSubscriptionForAgency(membership.agencyId);
}

export type ListingAllowance = {
  planId: string | null;
  planName: string;
  /** `null` means the plan has no cap. */
  limit: number | null;
  used: number;
  remaining: number | null;
  canCreate: boolean;
  agencyId: string | null;
};

export async function getListingAllowance(userId: string): Promise<ListingAllowance> {
  const membership = await getMembership(userId);
  if (!membership) {
    return {
      planId: null,
      planName: "Free",
      limit: FREE_LISTING_LIMIT,
      used: 0,
      remaining: FREE_LISTING_LIMIT,
      canCreate: false,
      agencyId: null,
    };
  }

  const [subscription, used] = await Promise.all([
    getActiveSubscriptionForAgency(membership.agencyId),
    prisma.property.count({
      where: {
        agencyId: membership.agencyId,
        status: { in: ["draft", "pending_review", "published"] },
      },
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
    agencyId: membership.agencyId,
  };
}

export async function listSubscriptionsWithUsage() {
  const rows = await prisma.subscription.findMany({
    include: {
      plan: true,
      agency: {
        include: {
          members: {
            where: { role: "owner" },
            include: { user: { select: { id: true, name: true, email: true } } },
            take: 1,
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const counts = await prisma.property.groupBy({
    by: ["agencyId"],
    _count: { _all: true },
  });
  const usage = new Map(counts.map((c) => [c.agencyId, c._count._all]));

  return rows.map((row) => {
    const owner = row.agency.members[0]?.user;
    return {
      id: row.id,
      status: row.status,
      currentPeriodEnd: row.currentPeriodEnd,
      planName: row.plan.name,
      priceMonthly: row.plan.priceMonthly,
      listingLimit: row.plan.listingLimit,
      agencyId: row.agencyId,
      agencyName: row.agency.name ?? "Unnamed agency",
      userId: owner?.id ?? "",
      userName: owner?.name ?? "Unknown",
      userEmail: owner?.email ?? "",
      listings: usage.get(row.agencyId) ?? 0,
    };
  });
}
