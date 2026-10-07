import "server-only";

import type { AgentStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/server/auth";

export async function createBrokerProfileForUser(
  userId: string,
  opts?: { phone?: string; name?: string }
) {
  return prisma.brokerProfile.create({
    data: {
      userId,
      phone: opts?.phone,
      title: opts?.name ? "Platform broker" : undefined,
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
