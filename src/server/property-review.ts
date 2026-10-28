/** Property review rules. No database access — callers persist the result. */

export type ListingStatus = "draft" | "pending_review" | "published" | "rejected";
export type ReviewKind = "approved" | "rejected" | "unpublished" | "resubmitted";
export type ModerationTarget = "pending_review" | "published" | "rejected";

/** Public listings, search, detail, leads, and viewings use this status only. */
export const PUBLIC_LISTING_STATUS = "published" as const;

export function isPublicListingStatus(status: string) {
  return status === PUBLIC_LISTING_STATUS;
}

const MODERATION_TARGETS: readonly ModerationTarget[] = ["pending_review", "published", "rejected"];

export function parseModerationInput(input: {
  id?: string;
  status?: string;
  reason?: string;
}): { id: string; status: ModerationTarget; reason?: string } | { error: string } {
  if (!input.id?.trim()) return { error: "That listing no longer exists." };
  if (input.reason != null && input.reason.length > 2000) return { error: "Reason is too long." };
  if (!input.status || !MODERATION_TARGETS.includes(input.status as ModerationTarget)) {
    return { error: "Unsupported status." };
  }
  return {
    id: input.id,
    status: input.status as ModerationTarget,
    reason: input.reason,
  };
}

/** Admin review transitions. Anything else is refused. */
export function adminTransition(
  from: ListingStatus,
  to: ModerationTarget
): { action: ReviewKind } | { error: string } {
  if (from === "pending_review" && to === "published") return { action: "approved" };
  if (from === "pending_review" && to === "rejected") return { action: "rejected" };
  if (from === "published" && to === "pending_review") return { action: "unpublished" };
  return { error: "That status change is not allowed." };
}

export function reasonError(action: ReviewKind, reason: string | undefined): string | null {
  if (action !== "rejected" && action !== "unpublished") return null;
  if (!reason || reason.trim().length === 0) return "A reason is required.";
  if (reason.trim().length > 2000) return "Reason is too long.";
  return null;
}

/**
 * Non-admins never publish. Submit for review always queues the listing.
 * Admins may still choose a status directly, except where `nextStatusOnSave` blocks it.
 */
export function submittedListingStatus(requested: ListingStatus, isAdmin: boolean): ListingStatus {
  if (isAdmin) return requested;
  if (requested === "draft") return "draft";
  if (requested === "pending_review" || requested === "published") return "pending_review";
  return "draft";
}

/**
 * Owner saves must not publish a listing that is waiting on review, and must
 * not clear a rejection. Admins can still publish a draft or a queued listing.
 */
export function nextStatusOnSave(
  existing: ListingStatus,
  resolved: ListingStatus,
  isAdmin: boolean
): ListingStatus {
  if (existing === "rejected") return "rejected";
  if (!isAdmin && resolved === "published" && existing !== "published") {
    return existing === "draft" ? "pending_review" : existing;
  }
  return resolved;
}

export function resubmitBlockReason(
  actor: {
    role: string;
    userId: string;
    agencyId?: string | null;
    accountStatus?: string | null;
  },
  property: { status: string; sellerId: string | null; agencyId: string | null }
): string | null {
  if (property.status !== "rejected") return "Only rejected listings can be resubmitted.";

  const sellerOwns = actor.role === "SELLER" && property.sellerId === actor.userId;
  const agencyOwns =
    actor.role === "AGENCY" && !!actor.agencyId && property.agencyId === actor.agencyId;
  const adminOwns =
    actor.role === "ADMIN" &&
    (property.sellerId === actor.userId ||
      (!!actor.agencyId && property.agencyId === actor.agencyId));

  if (!sellerOwns && !agencyOwns && !adminOwns) {
    return "You can only resubmit your own listings.";
  }
  if (actor.role !== "ADMIN" && actor.accountStatus !== "active") {
    return "Your account must be approved before you can request review.";
  }
  return null;
}

export function reviewNotification(action: ReviewKind, reason: string): { title: string; body: string } {
  switch (action) {
    case "approved":
      return {
        title: "Property Approved",
        body: "Your property has been approved and is now live.",
      };
    case "rejected":
      return {
        title: "Property Rejected",
        body: `Your property requires changes before it can be published.\n\nReason:\n${reason}\n\nPlease make the required changes and submit the property for review again.`,
      };
    case "unpublished":
      return {
        title: "Property Unpublished",
        body: `Your property has been temporarily removed from the public site.\n\nReason:\n${reason}\n\nPlease review the requested changes and submit the property for review again.`,
      };
    case "resubmitted":
      return {
        title: "Property Resubmitted",
        body: "Your property has been submitted for review again.",
      };
  }
}

export function adminResubmitNotification(title: string) {
  return {
    title: "Property resubmitted for review",
    body: `${title} was submitted for review again.`,
  };
}

export function listingEditHref(property: { id: string; sellerId: string | null }) {
  return property.sellerId
    ? `/seller/properties/${property.id}/edit`
    : `/agency/properties/${property.id}/edit`;
}

export const REVIEW_ACTION_LABEL: Record<ReviewKind, string> = {
  approved: "Approved & Published",
  rejected: "Rejected",
  unpublished: "Unpublished",
  resubmitted: "Resubmitted for review",
};
