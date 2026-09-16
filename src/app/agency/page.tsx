import Link from "next/link";
import { Suspense } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ViewingStatusBadge } from "@/components/viewings/viewing-meta";
import { formatInZone } from "@/lib/viewings";
import { requireAgency } from "@/server/agency";
import { getAgentKpis } from "@/server/analytics";
import { listHostViewings } from "@/server/bookings";
import { listAgentProperties } from "@/server/properties";
import { getListingAllowance } from "@/server/subscriptions";

async function AgentOverview() {
  const { session, agency } = await requireAgency();
  if (!agency) {
    return <p className="text-sm text-muted-foreground">Complete onboarding to open the console.</p>;
  }

  const [kpis, allowance, recent, listings] = await Promise.all([
    getAgentKpis(agency.id),
    getListingAllowance(session.user.id),
    listHostViewings(session.user.id, session.user.role),
    listAgentProperties({ agencyId: agency.id }),
  ]);

  const rejected = listings.filter((row) => row.status === "rejected").length;
  const actions = [
    kpis.pendingBookings > 0
      ? {
          href: "/agency/viewings",
          label: `${kpis.pendingBookings} viewing request${kpis.pendingBookings === 1 ? "" : "s"} awaiting reply`,
        }
      : null,
    rejected > 0
      ? {
          href: "/agency/properties",
          label: `${rejected} listing${rejected === 1 ? "" : "s"} rejected — fix and resubmit`,
        }
      : null,
    agency.status === "pending_review"
      ? {
          href: "/auth/onboarding/agency",
          label: "Agency application is under review",
        }
      : null,
    allowance.remaining != null
      ? {
          href: "/agency/subscription",
          label: `${allowance.used} of ${allowance.limit} listings used on ${allowance.planName}`,
        }
      : null,
  ].filter(Boolean) as { href: string; label: string }[];

  const cards = [
    { label: "Active listings", value: kpis.active },
    { label: "Visit requests", value: kpis.bookings },
    { label: "Pending replies", value: kpis.pendingBookings },
    { label: "Conversion", value: `${kpis.conversion}%` },
  ];

  return (
    <>
      {agency.status !== "active" ? (
        <Card className="rounded-3xl border-amber-500/30 bg-amber-500/5">
          <CardContent className="py-4 text-sm">
            Agency status:{" "}
            <span className="font-medium capitalize">{agency.status.replaceAll("_", " ")}</span>
            {agency.status === "pending_review"
              ? " — you can draft listings, but they cannot go live until approval."
              : null}
            {agency.statusNote ? ` ${agency.statusNote}` : null}
          </CardContent>
        </Card>
      ) : null}

      <Card className="rounded-3xl">
        <CardHeader>
          <CardTitle>Needs attention</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {actions.length === 0 ? (
            <p className="text-sm text-muted-foreground">You&apos;re caught up.</p>
          ) : (
            actions.map((action) => (
              <Link
                key={action.href + action.label}
                href={action.href}
                className="block rounded-2xl border border-border px-4 py-3 text-sm hover:bg-muted/40"
              >
                {action.label}
              </Link>
            ))
          )}
        </CardContent>
      </Card>

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
          <Link href="/agency/subscription" className="font-medium text-primary hover:underline">
            Manage subscription →
          </Link>
        </CardContent>
      </Card>

      <Card className="rounded-3xl">
        <CardHeader>
          <CardTitle>Latest viewing requests</CardTitle>
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
                    {booking.name} ·{" "}
                    {booking.slots
                      .slice(0, 2)
                      .map((slot) => formatInZone(slot, booking.timezone))
                      .join(" · ")}
                  </p>
                </div>
                <ViewingStatusBadge status={booking.status} />
              </div>
            ))
          )}
          <Link href="/agency/viewings" className="text-sm font-medium text-primary hover:underline">
            Open viewing inbox →
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
          What needs a reply, then performance and plan usage.
        </p>
      </div>
      <Suspense fallback={<Skeleton className="h-96 w-full rounded-3xl" />}>
        <AgentOverview />
      </Suspense>
    </div>
  );
}
