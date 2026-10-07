import type { AgentStatus, Role } from "@prisma/client";

import type { ListingOwnerShape } from "@/lib/listing-ownership";
import { isAgencyOwned, isSellerOwned } from "@/lib/listing-ownership";

export type AccountGate = {
  role: Role;
  accountStatus?: AgentStatus | null;
};

function canWriteDraft(status: AgentStatus | null | undefined) {
  return status === "active" || status === "pending_review";
}

function canSubmit(status: AgentStatus | null | undefined) {
  return status === "active";
}

export function canCreateProperty(actor: AccountGate) {
  if (actor.role === "ADMIN") return true;
  if (actor.role === "SELLER" || actor.role === "AGENCY") {
    return canWriteDraft(actor.accountStatus);
  }
  return false;
}

export function canUploadPropertyImage(role: Role) {
  return role === "ADMIN" || role === "SELLER" || role === "AGENCY";
}

export function canSubmitProperty(actor: AccountGate) {
  if (actor.role === "ADMIN") return true;
  if (actor.role === "SELLER" || actor.role === "AGENCY") {
    return canSubmit(actor.accountStatus);
  }
  return false;
}

/** Only admins publish. autoPublish is a platform setting, not a seller/agency right. */
export function canPublishProperty(actor: AccountGate) {
  return actor.role === "ADMIN";
}

export function canEditProperty(
  actor: AccountGate & { userId: string; agencyId?: string | null },
  property: ListingOwnerShape & { sellerId: string | null }
) {
  if (actor.role === "ADMIN") return true;
  if (actor.role === "SELLER") {
    return isSellerOwned(property) && property.sellerId === actor.userId && canWriteDraft(actor.accountStatus);
  }
  if (actor.role === "AGENCY") {
    return isAgencyOwned(property) && property.agencyId === actor.agencyId && canWriteDraft(actor.accountStatus);
  }
  return false;
}

export function canDeleteProperty(
  actor: AccountGate & { userId: string; agencyId?: string | null },
  property: ListingOwnerShape & { sellerId: string | null }
) {
  if (actor.role === "ADMIN") return true;
  if (actor.role === "SELLER") {
    return isSellerOwned(property) && property.sellerId === actor.userId;
  }
  if (actor.role === "AGENCY") {
    return isAgencyOwned(property) && property.agencyId === actor.agencyId;
  }
  return false;
}

export function canMutateProperty(role: Role) {
  return role === "ADMIN" || role === "SELLER" || role === "AGENCY";
}
