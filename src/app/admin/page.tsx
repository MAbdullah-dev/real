import Link from "next/link";
import { Suspense } from "react";

import { RevenueChart } from "@/components/charts/trend-charts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getAdminKpis, getRevenueByMonth } from "@/server/analytics";
import { listPendingProperties } from "@/server/admin";

async function CommandCenter() {
  const [kpis, revenue, pending] = await Promise.all([
    getAdminKpis(),
    getRevenueByMonth(),
    listPendingProperties(),
  ]);

  const cards = [
    { label: "Users", value: kpis.users.toLocaleString("en-US") },
    { label: "Agents", value: kpis.agents.toLocaleString("en-US") },
    { label: "Live listings", value: kpis.properties.toLocaleString("en-US") },
    { label: "MRR", value: `$${kpis.mrr.toLocaleString("en-US")}` },
  ];

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Card key={card.label} className="rounded-3xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold tabular-nums">{card.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="rounded-3xl">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Awaiting review</CardTitle>
          <Link href="/admin/properties" className="text-sm font-medium text-primary hover:underline">
            Open queue →
          </Link>
        </CardHeader>
        <CardContent className="space-y-2">
          {pending.length === 0 ? (
            <p className="text-sm text-muted-foreground">The moderation queue is empty.</p>
          ) : (
            pending.map((property) => (
              <div
                key={property.id}
                className="flex items-center justify-between gap-4 rounded-2xl border border-border p-4 text-sm"
              >
                <span className="font-medium">{property.title}</span>
                <span className="text-muted-foreground">{property.city}</span>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card className="rounded-3xl">
        <CardHeader>
          <CardTitle>Subscription revenue</CardTitle>
        </CardHeader>
        <CardContent className="h-72">
          <RevenueChart data={revenue} />
        </CardContent>
      </Card>
    </>
  );
}

export default function AdminOverviewPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Command center</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Marketplace health, the moderation queue, and recurring revenue.
        </p>
      </div>
      <Suspense fallback={<Skeleton className="h-96 w-full rounded-3xl" />}>
        <CommandCenter />
      </Suspense>
    </div>
  );
}
