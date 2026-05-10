import { LayoutWide } from "@/components/layout/shell";
import { SUBSCRIPTION_PLANS } from "@/data/plans";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Agent subscription plans with listing caps and premium tooling.",
};

export default function PricingPage() {
  return (
    <LayoutWide className="py-16 sm:py-20 lg:py-24">
      <div className="max-w-2xl">
        <h1 className="text-4xl font-semibold tracking-tight">Plans for professional agents</h1>
        <p className="mt-4 text-muted-foreground">
          Transparent caps, upgradeable media, and analytics that mirror how modern brokerages operate.
        </p>
      </div>
      <div className="mt-12 grid gap-6 lg:grid-cols-3">
        {SUBSCRIPTION_PLANS.map((plan) => (
          <Card
            key={plan.id}
            className={`rounded-3xl ${plan.highlighted ? "border-primary shadow-[var(--shadow-soft)] ring-1 ring-primary/20" : ""}`}
          >
            <CardContent className="p-8">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-xl font-semibold">{plan.name}</h2>
                {plan.highlighted ? <Badge>Popular</Badge> : null}
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{plan.description}</p>
              <p className="mt-6 text-4xl font-semibold tabular-nums">
                ${plan.priceMonthly}
                <span className="text-base font-normal text-muted-foreground">/mo</span>
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                Listing limit:{" "}
                <span className="font-medium text-foreground">
                  {plan.listingLimit === "custom" ? "Custom" : `Up to ${plan.listingLimit}`}
                </span>
              </p>
              <ul className="mt-8 space-y-3 text-sm text-muted-foreground">
                {plan.features.map((f) => (
                  <li key={f} className="flex gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button asChild className="mt-8 w-full rounded-full" variant={plan.highlighted ? "default" : "outline"}>
                <Link href="/checkout">Start checkout</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </LayoutWide>
  );
}
