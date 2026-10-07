/**
 * Authorization boundary checks for the listing model.
 * Run: npx tsx scripts/check-permissions.ts
 */
import {
  canCreateProperty,
  canDeleteProperty,
  canEditProperty,
  canMutateProperty,
  canPublishProperty,
  canSubmitProperty,
  canUploadPropertyImage,
} from "../src/server/property-permissions";
import {
  hasValidListingOwner,
  isAgencyOwned,
  isSellerOwned,
} from "../src/lib/listing-ownership";

function assert(condition: unknown, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

const sellerListing = { sellerId: "seller1", agencyId: null };
const agencyListing = { sellerId: null, agencyId: "agency-a1" };
const orphan = { sellerId: null, agencyId: null };

assert(isSellerOwned(sellerListing), "seller listing is seller-owned");
assert(isAgencyOwned(agencyListing), "agency listing is agency-owned");
assert(!isSellerOwned(agencyListing), "agency listing is not seller-owned");
assert(hasValidListingOwner(sellerListing), "seller listing has an owner");
assert(hasValidListingOwner(agencyListing), "agency listing has an owner");
assert(!hasValidListingOwner(orphan), "orphan listing is invalid");

assert(!canCreateProperty({ role: "USER" }), "USER cannot create");
assert(!canCreateProperty({ role: "BROKER", accountStatus: "active" }), "BROKER cannot create");
assert(canCreateProperty({ role: "SELLER", accountStatus: "active" }), "active SELLER can create");
assert(canCreateProperty({ role: "SELLER", accountStatus: "pending_review" }), "pending SELLER can draft");
assert(!canCreateProperty({ role: "SELLER", accountStatus: "onboarding" }), "onboarding SELLER cannot create");
assert(canCreateProperty({ role: "AGENCY", accountStatus: "active" }), "active AGENCY can create");
assert(canCreateProperty({ role: "ADMIN" }), "ADMIN can create");

assert(!canSubmitProperty({ role: "SELLER", accountStatus: "pending_review" }), "pending SELLER cannot submit");
assert(canSubmitProperty({ role: "SELLER", accountStatus: "active" }), "active SELLER can submit");
assert(!canPublishProperty({ role: "SELLER", accountStatus: "active" }), "SELLER cannot publish");
assert(!canPublishProperty({ role: "AGENCY", accountStatus: "active" }), "AGENCY cannot publish");
assert(canPublishProperty({ role: "ADMIN" }), "ADMIN can publish");

assert(!canUploadPropertyImage("USER"), "USER cannot upload");
assert(!canUploadPropertyImage("BROKER"), "BROKER cannot upload");
assert(canUploadPropertyImage("SELLER"), "SELLER can upload");
assert(canUploadPropertyImage("AGENCY"), "AGENCY can upload");
assert(!canMutateProperty("BROKER"), "BROKER cannot mutate");

assert(
  canEditProperty(
    { role: "SELLER", userId: "seller1", accountStatus: "active" },
    sellerListing
  ),
  "seller can edit own listing"
);
assert(
  !canEditProperty(
    { role: "SELLER", userId: "seller2", accountStatus: "active" },
    sellerListing
  ),
  "seller cannot edit another seller listing"
);
assert(
  !canEditProperty(
    { role: "BROKER", userId: "broker1", accountStatus: "active" },
    sellerListing
  ),
  "broker cannot edit seller listing"
);
assert(
  !canEditProperty(
    { role: "BROKER", userId: "broker1", accountStatus: "active" },
    agencyListing
  ),
  "broker cannot edit agency listing"
);
assert(
  !canEditProperty(
    { role: "AGENCY", userId: "a1", agencyId: "agency-a1", accountStatus: "active" },
    sellerListing
  ),
  "agency cannot edit seller listing"
);
assert(
  canEditProperty(
    { role: "AGENCY", userId: "a1", agencyId: "agency-a1", accountStatus: "active" },
    agencyListing
  ),
  "agency can edit own listing"
);
assert(
  !canDeleteProperty(
    { role: "BROKER", userId: "broker1", accountStatus: "active" },
    sellerListing
  ),
  "broker cannot delete listings"
);

console.log("property permission checks passed");
