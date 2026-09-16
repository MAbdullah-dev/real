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

export type ListingContactKind = "agency" | "broker" | "seller";

/** Who a buyer actually reaches for a listing, resolved from the ownership shape. */
export interface ListingContact {
  kind: ListingContactKind;
  /** The user who manages the listing and receives requests. */
  userId: string;
  name: string;
  avatar: string;
  /** Agency name, broker title, or owner label. */
  org: string;
  phone?: string;
  whatsapp?: string;
  verified: boolean;
  /** Public profile page — brokers and agencies have one, private owners do not. */
  profileHref?: string;
}

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
  contact: ListingContact;
  badges?: string[];
  videoUrl?: string;
  coordinates?: { lat: number; lng: number };
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
