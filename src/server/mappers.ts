import type {
  AgentProfile,
  Plan,
  Property as PropertyRow,
  PropertyImage,
  User,
} from "@prisma/client";
import type { Property, PropertyCategory, SubscriptionPlan } from "@/types";

export type PropertyWithAgent = PropertyRow & {
  images: PropertyImage[];
  agent: Pick<User, "id" | "name" | "image"> & {
    agentProfile: Pick<AgentProfile, "agency" | "phone" | "verified"> | null;
  };
};

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
    agentName: row.agent.name ?? "Agent",
    agentAvatar: row.agent.image ?? "",
    agentAgency: row.agent.agentProfile?.agency ?? undefined,
    agentPhone: row.agent.agentProfile?.phone ?? undefined,
    agentVerified: row.agent.agentProfile?.verified ?? false,
    badges: row.badges.length ? row.badges : undefined,
    videoUrl: row.videoUrl ?? undefined,
    coordinates:
      row.lat != null && row.lng != null ? { lat: row.lat, lng: row.lng } : undefined,
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
