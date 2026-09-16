import Link from "next/link";

import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import { listPlans } from "@/server/plans";

export default async function ForAgenciesPage() {
  const plans = await listPlans();

  return (
    <div className="bg-[radial-gradient(circle_at_top,_rgba(15,76,58,0.12),_transparent_45%)]">
      <section className="relative overflow-hidden px-[var(--section-x)] pb-16 pt-16 sm:pt-20">
        <div className="mx-auto max-w-3xl text-center">
          <p
            className="text-5xl tracking-tight text-primary sm:text-6xl"
            style={{ fontFamily: "var(--font-display), serif" }}
          >
            Estate Elite
          </p>
          <h1 className="mt-6 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Run your agency on Estate Elite
          </h1>
          <p className="mt-4 text-base text-muted-foreground sm:text-lg">
            Agency profile, shared listings, viewings, and subscription plans — built for firms, not
            solo brokers.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg" className="rounded-full">
              <Link href="/auth/register/agency">Register your agency</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-full">
              <Link href="/auth/login">Sign in</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="px-[var(--section-x)] py-16">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-2xl font-semibold tracking-tight">Agency plans</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {plans.map((plan) => (
              <div key={plan.id} className="rounded-3xl border border-border bg-card/80 p-6">
                <p className="text-sm font-medium text-muted-foreground">{plan.name}</p>
                <p className="mt-2 text-3xl font-semibold tabular-nums">
                  {formatPrice(plan.priceMonthly)}
                  <span className="text-sm font-normal text-muted-foreground">/mo</span>
                </p>
                <p className="mt-3 text-sm text-muted-foreground">{plan.description}</p>
              </div>
            ))}
          </div>
        </div>
        <p className="mx-auto mt-10 max-w-5xl text-sm text-muted-foreground">
          Independent broker?{" "}
          <Link href="/for-brokers" className="font-medium text-foreground underline">
            Broker signup
          </Link>
        </p>
      </section>
    </div>
  );
}
