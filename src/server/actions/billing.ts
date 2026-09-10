"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getStripe, siteUrl, stripeConfigured } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/server/auth";
import { createNotification } from "@/server/notifications";
import { getActiveSubscription } from "@/server/subscriptions";

export type BillingActionResult = { ok?: true; error?: string; message?: string };

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Starts a Stripe Checkout session for the plan. Without Stripe credentials the
 * subscription is activated locally so the rest of the app stays testable.
 */
export async function startCheckoutAction(planId: string): Promise<BillingActionResult> {
  const session = await requireRole(["AGENT", "ADMIN"]);

  const plan = await prisma.plan.findUnique({ where: { id: planId } });
  if (!plan) return { error: "That plan is not available." };

  const stripe = getStripe();

  if (!stripe || !plan.stripePriceId) {
    const existing = await getActiveSubscription(session.user.id);
    const currentPeriodEnd = new Date(Date.now() + THIRTY_DAYS_MS);

    if (existing) {
      await prisma.subscription.update({
        where: { id: existing.id },
        data: { planId: plan.id, status: "active", currentPeriodEnd },
      });
    } else {
      await prisma.subscription.create({
        data: {
          userId: session.user.id,
          planId: plan.id,
          status: "active",
          currentPeriodEnd,
        },
      });
    }

    await createNotification(
      session.user.id,
      "Subscription updated",
      `You are now on the ${plan.name} plan.`
    );

    revalidatePath("/agent/subscription");
    revalidatePath("/agent");
    return {
      ok: true,
      message: stripeConfigured
        ? `${plan.name} activated. Add a Stripe price ID to this plan to bill it.`
        : `${plan.name} activated in local mode. Set STRIPE_SECRET_KEY to charge cards.`,
    };
  }

  const existing = await prisma.subscription.findFirst({
    where: { userId: session.user.id, stripeCustomerId: { not: null } },
    select: { stripeCustomerId: true },
  });

  const checkout = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: plan.stripePriceId, quantity: 1 }],
    ...(existing?.stripeCustomerId
      ? { customer: existing.stripeCustomerId }
      : { customer_email: session.user.email ?? undefined }),
    client_reference_id: session.user.id,
    metadata: { userId: session.user.id, planId: plan.id },
    subscription_data: { metadata: { userId: session.user.id, planId: plan.id } },
    success_url: `${siteUrl()}/agent/subscription?checkout=success`,
    cancel_url: `${siteUrl()}/checkout?checkout=cancelled`,
  });

  if (!checkout.url) return { error: "Stripe did not return a checkout URL." };
  redirect(checkout.url);
}

export async function openBillingPortalAction(): Promise<BillingActionResult> {
  const session = await requireRole(["AGENT", "ADMIN"]);
  const stripe = getStripe();
  if (!stripe) return { error: "Stripe is not configured on this environment." };

  const subscription = await prisma.subscription.findFirst({
    where: { userId: session.user.id, stripeCustomerId: { not: null } },
    select: { stripeCustomerId: true },
  });
  if (!subscription?.stripeCustomerId) {
    return { error: "No Stripe customer yet — start a subscription first." };
  }

  const portal = await stripe.billingPortal.sessions.create({
    customer: subscription.stripeCustomerId,
    return_url: `${siteUrl()}/agent/subscription`,
  });

  redirect(portal.url);
}

export async function cancelSubscriptionAction(): Promise<BillingActionResult> {
  const session = await requireRole(["AGENT", "ADMIN"]);

  const subscription = await getActiveSubscription(session.user.id);
  if (!subscription) return { error: "You do not have an active subscription." };

  const stripe = getStripe();
  if (stripe && subscription.stripeSubscriptionId) {
    await stripe.subscriptions.cancel(subscription.stripeSubscriptionId);
  }

  await prisma.subscription.update({
    where: { id: subscription.id },
    data: { status: "canceled" },
  });

  revalidatePath("/agent/subscription");
  revalidatePath("/agent");
  return { ok: true, message: "Subscription cancelled." };
}
