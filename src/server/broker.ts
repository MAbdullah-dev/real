import "server-only";

import type { AgentStatus } from "@prisma/client";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/server/auth";

/** Independent brokers without a paid plan may keep this many live listings. */
export const BROKER_FREE_LISTING_LIMIT = 5;

export async function createBrokerProfileForUser(
  userId: string,
  opts?: { phone?: string; name?: string }
) {
  return prisma.brokerProfile.create({
    data: {
      userId,
      phone: opts?.phone,
      title: opts?.name ? "Broker" : undefined,
      status: "onboarding",
      onboardingStep: 0,
    },
  });
}

export async function getBrokerProfile(userId: string) {
  return prisma.brokerProfile.findUnique({ where: { userId } });
}

export async function requireBroker() {
  const session = await requireRole(["BROKER", "ADMIN"]);
  if (session.user.role === "ADMIN") {
    const profile = await getBrokerProfile(session.user.id);
    return { session, profile, isAdmin: true as const };
  }

  let profile = await getBrokerProfile(session.user.id);
  if (!profile) {
    profile = await createBrokerProfileForUser(session.user.id);
  }
  return { session, profile, isAdmin: false as const };
}

export function brokerConsoleAccess(status: AgentStatus | undefined) {
  if (status === "active") return "full" as const;
  if (status === "pending_review" || status === "suspended") return "readonly" as const;
  return "onboarding" as const;
}

export function brokerCanCreateDraft(status: AgentStatus) {
  return status === "active" || status === "pending_review";
}

export function brokerCanPublish(status: AgentStatus) {
  return status === "active";
}

export async function requireActiveBrokerForWrite() {
  const ctx = await requireBroker();
  if (ctx.isAdmin) return ctx;
  if (!ctx.profile || !brokerCanCreateDraft(ctx.profile.status)) {
    redirect("/auth/onboarding/broker");
  }
  return ctx;
}

export async function getBrokerListingAllowance(userId: string) {
  const used = await prisma.property.count({
    where: {
      agentId: userId,
      agencyId: null,
      sellerId: null,
      status: { in: ["draft", "pending_review", "published"] },
    },
  });
  const limit = BROKER_FREE_LISTING_LIMIT;
  return {
    limit,
    used,
    remaining: Math.max(0, limit - used),
    canCreate: used < limit,
  };
}
