import Link from "next/link";
import { Suspense } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getAgentKpis } from "@/server/analytics";
import { requireRole } from "@/server/auth";
import { listAgentBookings } from "@/server/bookings";
import { getListingAllowance } from "@/server/subscriptions";

async function AgentOverview() {
  const session = await requireRole(["AGENT", "ADMIN"]);
  const [kpis, allowance, recent] = await Promise.all([
    getAgentKpis(session.user.id),
    getListingAllowance(session.user.id),
    listAgentBookings(session.user.id),
  ]);

  const cards = [
    { label: "Active listings", value: kpis.active },
    { label: "Visit requests", value: kpis.bookings },
    { label: "Pending replies", value: kpis.pendingBookings },
    { label: "Conversion", value: `${kpis.conversion}%` },
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
              <p className="text-3xl font-semibold tabular-nums">{card.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="rounded-3xl">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Plan usage</CardTitle>
          <Badge variant="secondary">{allowance.planName}</Badge>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            {allowance.limit == null
              ? `${allowance.used} listings · unlimited on this plan`
              : `${allowance.used} of ${allowance.limit} listings used`}
          </p>
          <Link href="/agent/subscription" className="font-medium text-primary hover:underline">
            Manage subscription →
          </Link>
        </CardContent>
      </Card>

      <Card className="rounded-3xl">
        <CardHeader>
          <CardTitle>Latest visit requests</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {recent.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No requests yet. Publish a listing to start collecting them.
            </p>
          ) : (
            recent.slice(0, 5).map((booking) => (
              <div
                key={booking.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border p-4"
              >
                <div>
                  <p className="text-sm font-medium">{booking.property.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {booking.name} · {booking.requestedDates}
                  </p>
                </div>
                <Badge
                  variant={booking.status === "confirmed" ? "default" : "secondary"}
                  className="capitalize"
                >
                  {booking.status}
                </Badge>
              </div>
            ))
          )}
          <Link href="/agent/bookings" className="text-sm font-medium text-primary hover:underline">
            Open booking inbox →
          </Link>
        </CardContent>
      </Card>
    </>
  );
}

export default function AgentOverviewPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Agent overview</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Performance, pipeline health, and subscription utilization.
        </p>
      </div>
      <Suspense fallback={<Skeleton className="h-96 w-full rounded-3xl" />}>
        <AgentOverview />
      </Suspense>
    </div>
  );
}
