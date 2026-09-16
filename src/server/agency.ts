import "server-only";

import type { AgencyType, AgentStatus, CredentialType } from "@prisma/client";
import { redirect } from "next/navigation";

import { CREDENTIAL_LABELS } from "@/lib/agency-labels";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/server/auth";

export { CREDENTIAL_LABELS };

/** Country-keyed required docs. Pakistan-first; generic fallback for abroad. */
export function requiredCredentialTypes(
  country: string | null | undefined,
  type: AgencyType
): CredentialType[] {
  const code = (country ?? "PK").toUpperCase();
  if (code === "PK") {
    const required: CredentialType[] = ["national_id"];
    if (type !== "individual") required.push("business_registration");
    return required;
  }
  const required: CredentialType[] = ["national_id", "real_estate_license"];
  if (type !== "individual") required.push("business_registration");
  return required;
}

export async function createAgencyForUser(
  userId: string,
  opts?: { phone?: string; name?: string; type?: AgencyType }
) {
  return prisma.agency.create({
    data: {
      name: opts?.name,
      phone: opts?.phone,
      type: opts?.type ?? "agency",
      status: "onboarding",
      onboardingStep: 0,
      members: {
        create: { userId, role: "owner" },
      },
    },
    include: { members: true },
  });
}

export async function getMembership(userId: string) {
  return prisma.agencyMember.findUnique({
    where: { userId },
    include: {
      agency: {
        include: {
          credentials: { orderBy: { type: "asc" } },
          subscriptions: {
            where: { status: { in: ["active", "trialing"] } },
            include: { plan: true },
            take: 1,
            orderBy: { createdAt: "desc" },
          },
        },
      },
    },
  });
}

export async function requireAgency() {
  const session = await requireRole(["AGENCY", "ADMIN"]);
  if (session.user.role === "ADMIN") {
    const membership = await getMembership(session.user.id);
    return { session, membership, agency: membership?.agency ?? null, isAdmin: true as const };
  }

  const membership = await getMembership(session.user.id);
  if (!membership) {
    await createAgencyForUser(session.user.id, { type: "agency" });
    const refreshed = await getMembership(session.user.id);
    return {
      session,
      membership: refreshed!,
      agency: refreshed!.agency,
      isAdmin: false as const,
    };
  }

  return {
    session,
    membership,
    agency: membership.agency,
    isAdmin: false as const,
  };
}

export function agencyConsoleAccess(status: AgentStatus | undefined) {
  if (status === "active") return "full" as const;
  if (status === "pending_review" || status === "suspended") return "readonly" as const;
  return "onboarding" as const;
}

/** @deprecated use agencyConsoleAccess */
export const agentConsoleAccess = agencyConsoleAccess;

export function canCreateDraft(status: AgentStatus) {
  return status === "active" || status === "pending_review";
}

export function canSubmitListing(status: AgentStatus) {
  return status === "active";
}

export async function requireActiveAgencyForWrite() {
  const ctx = await requireAgency();
  if (ctx.isAdmin) return ctx;
  if (!ctx.agency || !canCreateDraft(ctx.agency.status)) {
    redirect("/auth/onboarding/agency");
  }
  return ctx;
}

/** @deprecated use requireActiveAgencyForWrite */
export const requireActiveAgentForWrite = requireActiveAgencyForWrite;

export async function assertCanSubmitListings(agencyStatus: AgentStatus, isAdmin: boolean) {
  if (isAdmin) return;
  if (!canSubmitListing(agencyStatus)) {
    return "Your agency must be approved before listings can go live.";
  }
  return null;
}
