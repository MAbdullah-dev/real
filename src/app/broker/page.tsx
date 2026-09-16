import Link from "next/link";
import { Suspense } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { countHostViewings } from "@/server/bookings";
import { getBrokerListingAllowance, requireBroker } from "@/server/broker";
import { listBrokerProperties } from "@/server/properties";

async function BrokerOverview() {
  const { session, profile, isAdmin } = await requireBroker();
  if (!profile && !isAdmin) {
    return <p className="text-sm text-muted-foreground">Complete onboarding to open the console.</p>;
  }

  const [listings, allowance, pending] = await Promise.all([
    listBrokerProperties(session.user.id),
    getBrokerListingAllowance(session.user.id),
    countHostViewings(session.user.id, session.user.role, "pending"),
  ]);

  return (
    <>
      {profile && profile.status !== "active" ? (
        <Card className="rounded-3xl border-amber-500/30 bg-amber-500/5">
          <CardContent className="py-4 text-sm">
            Broker status:{" "}
            <span className="font-medium capitalize">{profile.status.replaceAll("_", " ")}</span>
            {profile.status === "pending_review"
              ? " — draft listings are allowed; live publish waits for approval."
              : null}
            {profile.statusNote ? ` ${profile.statusNote}` : null}
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Listings", value: listings.length },
          { label: "Pending viewings", value: pending },
          { label: "Slots used", value: `${allowance.used}/${allowance.limit}` },
        ].map((card) => (
          <Card key={card.label} className="rounded-3xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{card.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold tabular-nums">{card.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="rounded-3xl">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Your work</CardTitle>
          <Button asChild size="sm" className="rounded-full">
            <Link href="/broker/properties/new">Add listing</Link>
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {listings.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              List properties you represent, then manage viewings with buyers and sellers.
            </p>
          ) : (
            listings.slice(0, 5).map((row) => (
              <div key={row.property.id} className="flex items-center justify-between gap-3">
                <Link
                  href={`/broker/properties/${row.property.id}/edit`}
                  className="font-medium hover:underline"
                >
                  {row.property.title}
                </Link>
                <Badge variant="outline" className="capitalize">
                  {row.status.replaceAll("_", " ")}
                </Badge>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </>
  );
}

export default function BrokerHomePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Broker overview</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your own book of business — listings, viewings, and client connections.
        </p>
      </div>
      <Suspense fallback={<Skeleton className="h-64 w-full rounded-3xl" />}>
        <BrokerOverview />
      </Suspense>
    </div>
  );
}
