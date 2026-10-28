import type { PrismaClient } from "@prisma/client";

import {
  adminResubmitNotification,
  adminTransition,
  listingEditHref,
  parseModerationInput,
  reasonError,
  reviewNotification,
  type ListingStatus,
  type ModerationTarget,
} from "@/server/property-review";

export type ReviewWriteResult = { ok: true; id: string; slug: string } | { error: string };

export async function moderatePropertyAs(
  db: PrismaClient,
  actor: { role: string; userId: string },
  input: { id?: string; status?: string; reason?: string }
): Promise<ReviewWriteResult> {
  if (actor.role !== "ADMIN") return { error: "Only admins can review listings." };

  const parsed = parseModerationInput(input);
  if ("error" in parsed) return parsed;

  return db.$transaction(async (tx) => {
    const property = await tx.property.findUnique({
      where: { id: parsed.id },
      select: { id: true, title: true, slug: true, status: true, agentId: true, sellerId: true },
    });
    if (!property) return { error: "That listing no longer exists." };

    const transition = adminTransition(property.status as ListingStatus, parsed.status as ModerationTarget);
    if ("error" in transition) return transition;

    const reason = parsed.reason?.trim() ?? "";
    const reasonProblem = reasonError(transition.action, reason);
    if (reasonProblem) return { error: reasonProblem };

    const updated = await tx.property.updateMany({
      where: { id: property.id, status: property.status },
      data: { status: parsed.status },
    });
    if (updated.count !== 1) return { error: "That status change is not allowed." };
    await tx.propertyReviewAction.create({
      data: {
        propertyId: property.id,
        adminId: actor.userId,
        action: transition.action,
        reason: reason || null,
      },
    });

    const copy = reviewNotification(transition.action, reason);
    await tx.notification.create({
      data: {
        userId: property.agentId,
        title: copy.title,
        body: copy.body,
        href: listingEditHref(property),
      },
    });

    return { ok: true as const, id: property.id, slug: property.slug };
  });
}

export async function resubmitPropertyAs(
  db: PrismaClient,
  propertyId: string
): Promise<ReviewWriteResult> {
  return db.$transaction(async (tx) => {
    const property = await tx.property.findUnique({
      where: { id: propertyId },
      select: { id: true, title: true, slug: true, status: true, agentId: true, sellerId: true },
    });
    if (!property) return { error: "That listing no longer exists." };
    if (property.status !== "rejected") return { error: "Only rejected listings can be resubmitted." };

    const updated = await tx.property.updateMany({
      where: { id: property.id, status: "rejected" },
      data: { status: "pending_review" },
    });
    if (updated.count !== 1) return { error: "Only rejected listings can be resubmitted." };
    await tx.propertyReviewAction.create({
      data: {
        propertyId: property.id,
        action: "resubmitted",
      },
    });

    const ownerCopy = reviewNotification("resubmitted", "");
    const adminCopy = adminResubmitNotification(property.title);
    const admins = await tx.user.findMany({
      where: { role: "ADMIN", id: { not: property.agentId } },
      select: { id: true },
    });

    await tx.notification.createMany({
      data: [
        {
          userId: property.agentId,
          title: ownerCopy.title,
          body: ownerCopy.body,
          href: listingEditHref(property),
        },
        ...admins.map((admin) => ({
          userId: admin.id,
          title: adminCopy.title,
          body: adminCopy.body,
          href: `/admin/properties/${property.id}`,
        })),
      ],
    });

    return { ok: true as const, id: property.id, slug: property.slug };
  });
}
