import type { SubscriptionPlan } from "@/types";

/** Seed source only — pages read from Prisma via `@/server/plans`. */

/** Agencies with no active or trialing subscription. */
export const FREE_LISTING_LIMIT = 1;

/** Sellers have no paid plan. */
export const SELLER_FREE_LISTING_LIMIT = 3;

/** Statuses that count toward a listing cap. `rejected` does not. */
export const LISTING_LIMIT_STATUSES = ["draft", "pending_review", "published"] as const;

/** Statuses that unlock `Plan.listingLimit`. Anything else is the free cap. */
export const ACTIVE_SUBSCRIPTION_STATUSES = ["active", "trialing"] as const;

function capFeature(limit: number | "custom") {
  return limit === "custom" ? "Custom listing caps" : `Up to ${limit} active listings`;
}

const BASIC_LISTING_LIMIT = 3;
const PREMIUM_LISTING_LIMIT = 6;

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: "basic",
    name: "Basic",
    description: "For emerging agents building their first premium portfolio.",
    priceMonthly: 49,
    listingLimit: BASIC_LISTING_LIMIT,
    features: [
      capFeature(BASIC_LISTING_LIMIT),
      "HD photography toolkit",
      "Lead inbox",
      "Standard analytics",
      "Email support",
    ],
  },
  {
    id: "premium",
    name: "Premium",
    description: "Scale visibility with richer media and conversion tooling.",
    priceMonthly: 129,
    listingLimit: PREMIUM_LISTING_LIMIT,
    features: [
      capFeature(PREMIUM_LISTING_LIMIT),
      "Video & 360 placeholders",
      "Priority placement in categories",
      "Advanced funnel analytics",
      "Dedicated success manager",
    ],
    highlighted: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    description: "Custom limits, API access, and white-glove onboarding.",
    priceMonthly: 499,
    listingLimit: "custom",
    features: [
      capFeature("custom"),
      "API & webhook integrations",
      "SSO & audit logs",
      "Revenue operations review",
      "24/7 priority line",
    ],
  },
];

/** `null` means the plan has no numeric cap. */
export function planListingCap(listingLimit: number | "custom"): number | null {
  return listingLimit === "custom" ? null : listingLimit;
}

/**
 * Smallest paid plan that can hold `count` listings which count toward the cap.
 * `null` means the free allowance is enough and no subscription should be seeded.
 */
export function planIdForListingCount(count: number): string | null {
  if (count <= FREE_LISTING_LIMIT) return null;

  const fitting = SUBSCRIPTION_PLANS.map((plan) => ({
    id: plan.id,
    cap: planListingCap(plan.listingLimit),
  }))
    .filter((plan) => plan.cap === null || plan.cap >= count)
    .sort((a, b) => {
      if (a.cap === null) return 1;
      if (b.cap === null) return -1;
      return a.cap - b.cap;
    });

  const chosen = fitting[0];
  if (!chosen) {
    throw new Error(`No plan in SUBSCRIPTION_PLANS can hold ${count} listings.`);
  }
  return chosen.id;
}
