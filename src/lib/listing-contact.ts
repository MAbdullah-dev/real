import type { ListingContactKind } from "@/types";

/** What the buyer is told about the person answering a listing. */
export const CONTACT_KIND_LABELS: Record<ListingContactKind, string> = {
  agency: "Listing agency",
  broker: "Broker",
  seller: "Owner",
};

export const CONTACT_KIND_BLURBS: Record<ListingContactKind, string> = {
  agency: "An agency team handles viewings for this listing.",
  broker: "An independent broker arranges viewings between you and the owner.",
  seller: "You deal directly with the owner of this property.",
};

/** Strips formatting so `tel:` / `wa.me` links stay valid. */
export function telHref(phone: string) {
  return `tel:${phone.replace(/[^+\d]/g, "")}`;
}

export function whatsappHref(phone: string) {
  return `https://wa.me/${phone.replace(/\D/g, "")}`;
}
