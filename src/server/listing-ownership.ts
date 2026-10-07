import "server-only";

import type { Prisma, Role } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import type { ListingOwnerShape } from "@/lib/listing-ownership";

export type { ListingOwnerShape } from "@/lib/listing-ownership";
export {
  hasValidListingOwner,
  isAgencyOwned,
  isSellerOwned,
} from "@/lib/listing-ownership";

/** Every active platform broker can act on every seller-owned listing. */
export function sellerPropertyScope(): Prisma.PropertyWhereInput {
  return { sellerId: { not: null }, agencyId: null };
}

/**
 * Who should be notified / may handle a buyer request.
 * Agency → agency members. Seller → owner + active platform brokers.
 */
export async function listingRequestRecipientIds(
  property: ListingOwnerShape
): Promise<string[]> {
  if (property.agencyId) {
    const members = await prisma.agencyMember.findMany({
      where: { agencyId: property.agencyId },
      select: { userId: true },
    });
    return [...new Set(members.map((member) => member.userId))];
  }

  if (property.sellerId) {
    const brokers = await prisma.brokerProfile.findMany({
      where: { status: "active" },
      select: { userId: true },
    });
    return [...new Set([property.sellerId, ...brokers.map((broker) => broker.userId)])];
  }

  return [];
}

export async function usersForListingRequests(property: ListingOwnerShape) {
  const ids = await listingRequestRecipientIds(property);
  if (ids.length === 0) return [] as Array<{ id: string; role: Role }>;
  return prisma.user.findMany({
    where: { id: { in: ids } },
    select: { id: true, role: true },
  });
}
