export type PropertyPurpose = "sale" | "rent";

export type PropertyCategory =
  | "apartment"
  | "villa"
  | "home"
  | "penthouse"
  | "luxury"
  | "commercial"
  | "office"
  | "shop"
  | "farmhouse"
  | "beach"
  | "short-stay"
  | "family"
  | "new-project"
  | "featured"
  | "trending"
  | "smart-home";

export interface Property {
  id: string;
  slug: string;
  title: string;
  description: string;
  address: string;
  city: string;
  country: string;
  price: number;
  purpose: PropertyPurpose;
  bedrooms: number;
  bathrooms: number;
  areaSqm: number;
  rating: number;
  reviewCount: number;
  categories: PropertyCategory[];
  image: string;
  gallery: string[];
  amenities: string[];
  furnished: boolean;
  agentId: string;
  agentName: string;
  agentAvatar: string;
  /** Profile fields are absent on the seed source and when an agent has no profile. */
  agentAgency?: string;
  agentPhone?: string;
  agentVerified?: boolean;
  badges?: string[];
  videoUrl?: string;
  coordinates?: { lat: number; lng: number };
}

export interface BookingRequest {
  id: string;
  propertyId: string;
  propertyTitle: string;
  status: "pending" | "confirmed" | "declined";
  requestedAt: string;
  visitDate?: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  priceMonthly: number;
  listingLimit: number | "custom";
  features: string[];
  highlighted?: boolean;
}
