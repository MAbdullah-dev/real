import { Suspense } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { auth } from "@/auth";
import { stripeConfigured } from "@/lib/stripe";
import { listPlans } from "@/server/plans";
import { getActiveSubscription } from "@/server/subscriptions";

import { CheckoutForm } from "./checkout-form";

async function Checkout() {
  const [plans, session] = await Promise.all([listPlans(), auth()]);
  const subscription = session?.user?.id ? await getActiveSubscription(session.user.id) : null;

  return (
    <CheckoutForm
      plans={plans}
      stripeReady={stripeConfigured}
      currentPlanId={subscription?.planId ?? null}
    />
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-3xl space-y-6 px-4 py-12 sm:px-6 lg:px-8">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-64 w-full rounded-3xl" />
        </div>
      }
    >
      <Checkout />
    </Suspense>
  );
}
