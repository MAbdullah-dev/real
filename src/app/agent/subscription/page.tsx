import Link from "next/link";
import { Suspense } from "react";

import { SubscriptionControls } from "@/components/agent/subscription-controls";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { stripeConfigured } from "@/lib/stripe";
import { requireRole } from "@/server/auth";
import { listPlans } from "@/server/plans";
import { getActiveSubscription, getListingAllowance } from "@/server/subscriptions";

async function SubscriptionContent() {
  const session = await requireRole(["AGENT", "ADMIN"]);
  const [subscription, allowance, plans] = await Promise.all([
    getActiveSubscription(session.user.id),
    getListingAllowance(session.user.id),
    listPlans(),
  ]);

  const usagePercent =
    allowance.limit == null ? 0 : Math.min(100, (allowance.used / allowance.limit) * 100);

  return (
    <>
      <Card className="rounded-3xl border-primary/30">
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle>{subscription?.plan.name ?? "Free"} plan</CardTitle>
            <p className="mt-2 text-sm text-muted-foreground">
              {subscription?.plan.description ??
                "No paid plan yet — you can keep one live listing."}
            </p>
          </div>
          <Badge variant={subscription ? "default" : "secondary"} className="capitalize">
            {subscription?.status ?? "free"}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Listing usage</span>
              <span className="tabular-nums">
                {allowance.limit == null
                  ? `${allowance.used} · unlimited`
                  : `${allowance.used} / ${allowance.limit}`}
              </span>
            </div>
            <Progress value={usagePercent} />
          </div>

          {subscription?.currentPeriodEnd ? (
            <p className="text-sm text-muted-foreground">
              Renews {subscription.currentPeriodEnd.toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          ) : null}

          <SubscriptionControls
            hasSubscription={Boolean(subscription)}
            stripeReady={stripeConfigured}
          />
        </CardContent>
      </Card>

      <Card className="rounded-3xl">
        <CardHeader>
          <CardTitle>Available plans</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`rounded-2xl border p-4 ${
                plan.id === subscription?.planId ? "border-primary bg-primary/5" : "border-border"
              }`}
            >
              <p className="font-medium">{plan.name}</p>
              <p className="mt-1 text-xl font-semibold tabular-nums">${plan.priceMonthly}/mo</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {plan.listingLimit === "custom"
                  ? "Custom listing cap"
                  : `${plan.listingLimit} listings`}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Button asChild variant="outline" className="rounded-full">
        <Link href="/checkout">Change plan</Link>
      </Button>
    </>
  );
}

export default function AgentSubscriptionPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Subscription</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Plan, listing cap, and billing management.
        </p>
      </div>
      <Suspense fallback={<Skeleton className="h-80 w-full rounded-3xl" />}>
        <SubscriptionContent />
      </Suspense>
    </div>
  );
}
