export type ListingOwnerShape = {
  agencyId: string | null;
  sellerId: string | null;
};

/** Agency-owned listing: buyer talks to the agency. */
export function isAgencyOwned(property: ListingOwnerShape) {
  return Boolean(property.agencyId);
}

/** Seller-owned listing: platform brokers handle the buyer. */
export function isSellerOwned(property: ListingOwnerShape) {
  return Boolean(property.sellerId) && !property.agencyId;
}

/** A published listing must have exactly one of these owners. */
export function hasValidListingOwner(property: ListingOwnerShape) {
  return isAgencyOwned(property) || isSellerOwned(property);
}
