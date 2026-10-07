import type {
  Agency,
  BrokerProfile,
  Plan,
  Property as PropertyRow,
  PropertyImage,
  SellerProfile,
  User,
} from "@prisma/client";
import { sanitizeMarketingBadges } from "@/lib/listing-contact";
import type {
  ListingContact,
  Property,
  PropertyCategory,
  SubscriptionPlan,
} from "@/types";

export type PropertyWithAgent = PropertyRow & {
  images: PropertyImage[];
  agent: Pick<User, "id" | "name" | "image"> & {
    brokerProfile: Pick<BrokerProfile, "phone" | "whatsapp" | "title" | "status"> | null;
    sellerProfile: Pick<SellerProfile, "phone" | "status"> | null;
  };
  agency: Pick<Agency, "name" | "phone" | "status"> | null;
};

/**
 * Ownership decides the buyer-facing contact.
 * Agency listings go to the agency. Seller listings stay owner-branded
 * but the platform handles the conversation. Brokers are never owners.
 */
export function toListingContact(row: PropertyWithAgent): ListingContact {
  const name = row.agent.name ?? "Listing contact";
  const avatar = row.agent.image ?? "";

  if (row.agencyId && row.agency) {
    return {
      kind: "agency",
      userId: row.agentId,
      name: row.agency.name ?? name,
      avatar,
      org: row.agency.name ? `${name} · ${row.agency.name}` : name,
      phone: row.agency.phone ?? undefined,
      verified: row.agency.status === "active",
      profileHref: `/agents/${row.agentId}`,
    };
  }

  if (row.sellerId) {
    return {
      kind: "seller",
      userId: row.sellerId,
      name,
      avatar,
      org: "Verified owner · platform-handled",
      verified: row.agent.sellerProfile?.status === "active",
    };
  }

  return {
    kind: "seller",
    userId: row.agentId,
    name: "Platform team",
    avatar,
    org: "This listing has no assigned owner",
    verified: false,
  };
}

export function toProperty(row: PropertyWithAgent): Property {
  const images = [...row.images].sort((a, b) => a.sortOrder - b.sortOrder);
  const cover = images.find((img) => img.isCover) ?? images[0];
  const gallery = images.filter((img) => img.id !== cover?.id).map((img) => img.url);

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    address: row.address,
    city: row.city,
    country: row.country,
    price: row.price,
    purpose: row.purpose,
    bedrooms: row.bedrooms,
    bathrooms: row.bathrooms,
    areaSqm: row.areaSqm,
    rating: row.rating,
    reviewCount: row.reviewCount,
    categories: row.categories as PropertyCategory[],
    image: cover?.url ?? "",
    gallery,
    amenities: row.amenities,
    furnished: row.furnished,
    agentId: row.agentId,
    contact: toListingContact(row),
    badges: (() => {
      const badges = sanitizeMarketingBadges(row.badges);
      return badges.length ? badges : undefined;
    })(),
    videoUrl: row.videoUrl ?? undefined,
    coordinates:
      row.lat != null && row.lng != null ? { lat: row.lat, lng: row.lng } : undefined,
    availableSlots: row.availableSlots.map((slot) => slot.toISOString()),
  };
}

export function toPlan(row: Plan): SubscriptionPlan {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    priceMonthly: row.priceMonthly,
    listingLimit: row.listingLimit ?? "custom",
    features: row.features,
    highlighted: row.highlighted,
  };
}

export function pickHeroProperties(properties: Property[]): Property[] {
  const scored = [...properties].sort((a, b) => heroScore(b) - heroScore(a));
  const unique = scored.slice(0, 7);
  return unique.length >= 4 ? unique : properties.slice(0, 6);
}

function heroScore(p: Property) {
  return (
    (p.categories.includes("luxury") ? 3 : 0) +
    (p.categories.includes("penthouse") ? 2 : 0) +
    (p.categories.includes("featured") ? 2 : 0) +
    p.rating
  );
}

export function propertiesByCategory(properties: Property[], category: string): Property[] {
  if (category === "recommended") {
    return [...properties].sort((a, b) => b.rating - a.rating).slice(0, 8);
  }
  return properties.filter((p) => p.categories.includes(category as PropertyCategory));
}
