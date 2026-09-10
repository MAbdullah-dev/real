import type { SubscriptionPlan } from "@/types";

/** Seed source only — pages read from Prisma via `@/server/plans`. */

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: "basic",
    name: "Basic",
    description: "For emerging agents building their first premium portfolio.",
    priceMonthly: 49,
    listingLimit: 3,
    features: [
      "Up to 3 active listings",
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
    listingLimit: 6,
    features: [
      "Up to 6 active listings",
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
      "Custom listing caps",
      "API & webhook integrations",
      "SSO & audit logs",
      "Revenue operations review",
      "24/7 priority line",
    ],
  },
];
