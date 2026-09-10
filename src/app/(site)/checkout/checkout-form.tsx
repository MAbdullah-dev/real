"use client";

import { Check, Loader2 } from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { startCheckoutAction } from "@/server/actions/billing";
import type { SubscriptionPlan } from "@/types";

export function CheckoutForm({
  plans,
  stripeReady,
  currentPlanId,
}: {
  plans: SubscriptionPlan[];
  stripeReady: boolean;
  currentPlanId: string | null;
}) {
  const [pending, startTransition] = React.useTransition();
  const [selected, setSelected] = React.useState(
    currentPlanId ?? plans.find((plan) => plan.highlighted)?.id ?? plans[0]?.id ?? ""
  );

  const plan = plans.find((item) => item.id === selected);

  function submit() {
    if (!plan) return;
    startTransition(async () => {
      const result = await startCheckoutAction(plan.id);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      if (result?.message) toast.success(result.message);
    });
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-semibold tracking-tight">Choose your plan</h1>
      <p className="mt-2 text-muted-foreground">
        {stripeReady
          ? "You will be redirected to Stripe to complete payment securely."
          : "Stripe keys are not set, so plans activate immediately in local mode."}
      </p>

      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        {plans.map((item) => {
          const active = item.id === selected;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setSelected(item.id)}
              className={`rounded-3xl border p-5 text-left transition ${
                active ? "border-primary bg-primary/5" : "border-border hover:bg-muted/40"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold">{item.name}</p>
                {item.id === currentPlanId ? (
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[11px]">Current</span>
                ) : null}
              </div>
              <p className="mt-1 text-2xl font-semibold tabular-nums">${item.priceMonthly}</p>
              <p className="text-xs text-muted-foreground">per month</p>
              <ul className="mt-4 space-y-1.5 text-xs text-muted-foreground">
                {item.features.slice(0, 4).map((feature) => (
                  <li key={feature} className="flex gap-1.5">
                    <Check className="mt-0.5 h-3 w-3 shrink-0 text-primary" />
                    {feature}
                  </li>
                ))}
              </ul>
            </button>
          );
        })}
      </div>

      {plan ? (
        <Card className="mt-8 rounded-3xl">
          <CardContent className="space-y-4 p-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="font-medium">{plan.name}</p>
                <p className="text-sm text-muted-foreground">
                  Listing cap:{" "}
                  {plan.listingLimit === "custom" ? "custom" : plan.listingLimit} · billed monthly
                </p>
              </div>
              <p className="text-2xl font-semibold tabular-nums">${plan.priceMonthly}/mo</p>
            </div>
            <Button
              type="button"
              className="w-full rounded-full"
              onClick={submit}
              disabled={pending}
            >
              {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {stripeReady ? "Continue to payment" : `Activate ${plan.name}`}
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              Manage or cancel anytime from{" "}
              <Link href="/agent/subscription" className="underline">
                your subscription page
              </Link>
              .
            </p>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
