/**
 * Suggested REST + webhook contracts for a production backend.
 * Replace mock data modules with fetchers that target these endpoints.
 */

export const API_ROUTES = {
  properties: {
    list: "GET /api/properties",
    detail: "GET /api/properties/:slug",
    create: "POST /api/agent/properties",
    update: "PATCH /api/agent/properties/:id",
    approve: "POST /api/admin/properties/:id/approve",
  },
  bookings: {
    create: "POST /api/bookings",
    listUser: "GET /api/me/bookings",
    listAgent: "GET /api/agent/bookings",
    listAdmin: "GET /api/admin/bookings",
    updateStatus: "PATCH /api/admin/bookings/:id",
  },
  subscriptions: {
    plans: "GET /api/plans",
    checkout: "POST /api/billing/checkout",
    portal: "POST /api/billing/portal",
    webhook: "POST /api/webhooks/stripe",
  },
  auth: {
    login: "POST /api/auth/login",
    register: "POST /api/auth/register",
    verifyOtp: "POST /api/auth/verify",
    refresh: "POST /api/auth/refresh",
  },
  wishlist: {
    sync: "PUT /api/me/wishlist",
  },
} as const;

/** Event fan-out for admin analytics + agent CRM */
export type WebhookEvent =
  | { type: "booking.created"; payload: { id: string; propertyId: string } }
  | { type: "booking.confirmed"; payload: { id: string; visitAt: string } }
  | { type: "subscription.updated"; payload: { agentId: string; planId: string } };
