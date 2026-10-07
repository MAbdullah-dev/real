import type { ListingContactKind } from "@/types";

/** What the buyer is told about the person answering a listing. */
export const CONTACT_KIND_LABELS: Record<ListingContactKind, string> = {
  agency: "Listing agency",
  broker: "Platform representative",
  seller: "Owner",
};

export const CONTACT_VERIFIED_LABELS: Record<ListingContactKind, string> = {
  agency: "Verified Agency",
  broker: "Verified representative",
  seller: "Verified Owner",
};

export const CONTACT_KIND_BLURBS: Record<ListingContactKind, string> = {
  agency: "The listing agency handles questions and viewings directly.",
  broker: "A platform representative handles buyer questions and viewings.",
  seller: "The owner listed this property. The platform team handles questions and viewings.",
};

export const RESERVED_MARKETING_BADGES = new Set(["verified"]);

export function sanitizeMarketingBadges(badges: string[]) {
  return badges.filter((badge) => !RESERVED_MARKETING_BADGES.has(badge.trim().toLowerCase()));
}

/** Strips formatting so `tel:` / `wa.me` links stay valid. */
export function telHref(phone: string) {
  return `tel:${phone.replace(/[^+\d]/g, "")}`;
}

export function whatsappHref(phone: string) {
  return `https://wa.me/${phone.replace(/\D/g, "")}`;
}
