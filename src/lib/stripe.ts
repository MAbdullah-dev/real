import "server-only";

import Stripe from "stripe";

export const stripeConfigured = Boolean(process.env.STRIPE_SECRET_KEY);

let client: Stripe | null = null;

/** Returns `null` when `STRIPE_SECRET_KEY` is unset so callers can fall back to local activation. */
export function getStripe() {
  if (!stripeConfigured) return null;
  client ??= new Stripe(process.env.STRIPE_SECRET_KEY!, { typescript: true });
  return client;
}

export function siteUrl() {
  return process.env.AUTH_URL ?? "http://localhost:3000";
}
