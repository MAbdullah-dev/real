import type { Role } from "@prisma/client";

/** Product labels for marketplace personas (+ admin). */
export const ROLE_LABELS: Record<Role, string> = {
  USER: "Buyer",
  SELLER: "Seller",
  BROKER: "Broker",
  AGENCY: "Agency",
  ADMIN: "Admin",
};

export function homeForRole(role?: Role | string) {
  if (role === "ADMIN") return "/admin";
  if (role === "AGENCY") return "/agency";
  if (role === "BROKER") return "/broker";
  if (role === "SELLER") return "/seller";
  return "/dashboard";
}

/** Buyer workspace is available to every signed-in person. */
export const BUYER_ROLES: Role[] = ["USER", "SELLER", "BROKER", "AGENCY", "ADMIN"];

/** Personas that receive and act on viewing requests. */
export const HOST_ROLES: Role[] = ["SELLER", "BROKER", "AGENCY", "ADMIN"];

export function hostViewingsHref(role: Role) {
  if (role === "ADMIN") return "/admin/bookings";
  if (role === "AGENCY") return "/agency/viewings";
  if (role === "BROKER") return "/broker/viewings";
  if (role === "SELLER") return "/seller/viewings";
  return "/dashboard/viewings";
}

export function hostEnquiriesHref(role: Role) {
  if (role === "AGENCY") return "/agency/messages";
  if (role === "BROKER") return "/broker/messages";
  if (role === "SELLER") return "/seller/messages";
  return "/dashboard/messages";
}

export const BROKER_ROLES: Role[] = ["BROKER", "ADMIN"];
export const AGENCY_ROLES: Role[] = ["AGENCY", "ADMIN"];
export const SELLER_ROLES: Role[] = ["SELLER", "ADMIN"];
