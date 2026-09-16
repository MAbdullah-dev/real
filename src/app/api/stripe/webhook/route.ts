import type { SubscriptionStatus } from "@prisma/client";
import type Stripe from "stripe";

import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";

const STATUS_MAP: Record<string, SubscriptionStatus> = {
  incomplete: "incomplete",
  incomplete_expired: "canceled",
  trialing: "trialing",
  active: "active",
  past_due: "past_due",
  canceled: "canceled",
  unpaid: "past_due",
  paused: "canceled",
};

function periodEnd(subscription: Stripe.Subscription) {
  const seconds = subscription.items.data[0]?.current_period_end;
  return seconds ? new Date(seconds * 1000) : null;
}

async function syncSubscription(subscription: Stripe.Subscription) {
  const agencyId = subscription.metadata?.agencyId;
  const planId = subscription.metadata?.planId;
  if (!agencyId || !planId) return;

  const data = {
    agencyId,
    planId,
    status: STATUS_MAP[subscription.status] ?? "incomplete",
    stripeCustomerId:
      typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id,
    stripeSubscriptionId: subscription.id,
    currentPeriodEnd: periodEnd(subscription),
  };

  await prisma.subscription.upsert({
    where: { stripeSubscriptionId: subscription.id },
    update: data,
    create: data,
  });
}

export async function POST(request: Request) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripe || !secret) {
    return new Response("Stripe is not configured.", { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) return new Response("Missing signature.", { status: 400 });

  const body = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, secret);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid signature.";
    return new Response(`Webhook error: ${message}`, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      if (session.subscription) {
        const id =
          typeof session.subscription === "string"
            ? session.subscription
            : session.subscription.id;
        await syncSubscription(await stripe.subscriptions.retrieve(id));
      }
      break;
    }
    case "customer.subscription.created":
    case "customer.subscription.updated": {
      await syncSubscription(event.data.object);
      break;
    }
    case "customer.subscription.deleted": {
      await prisma.subscription.updateMany({
        where: { stripeSubscriptionId: event.data.object.id },
        data: { status: "canceled" },
      });
      break;
    }
    default:
      break;
  }

  return Response.json({ received: true });
}
