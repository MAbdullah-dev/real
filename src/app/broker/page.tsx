import Link from "next/link";
import { Suspense } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { countHostEnquiries, countHostViewings } from "@/server/bookings";
import { requireBroker } from "@/server/broker";
import { listPlatformSellerProperties } from "@/server/properties";

async function BrokerOverview() {
  const { session, profile, isAdmin } = await requireBroker();
  if (!profile && !isAdmin) {
    return <p className="text-sm text-muted-foreground">Complete onboarding to open the console.</p>;
  }

  const [pendingViewings, openEnquiries, sellerListings] = await Promise.all([
    countHostViewings(session.user.id, session.user.role, "pending"),
    countHostEnquiries(session.user.id, session.user.role, "open"),
    listPlatformSellerProperties(),
  ]);

  return (
    <>
      {profile && profile.status !== "active" ? (
        <Card className="rounded-3xl border-amber-500/30 bg-amber-500/5">
          <CardContent className="py-4 text-sm">
            Broker status:{" "}
            <span className="font-medium capitalize">{profile.status.replaceAll("_", " ")}</span>
            {profile.status === "pending_review"
              ? " — you can review assigned seller-property work after approval."
              : null}
            {profile.statusNote ? ` ${profile.statusNote}` : null}
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Seller listings", value: sellerListings.length },
          { label: "Pending viewings", value: pendingViewings },
          { label: "Open enquiries", value: openEnquiries },
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
          <CardTitle>Seller-property work</CardTitle>
          <Button asChild size="sm" variant="outline" className="rounded-full">
            <Link href="/broker/viewings">Open viewings</Link>
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {sellerListings.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              When a buyer asks about a seller-owned home, it appears here. Agency listings stay
              with the agency.
            </p>
          ) : (
            sellerListings.slice(0, 5).map((row) => (
              <div key={row.property.id} className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium">{row.property.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {row.property.city} · {row.leads} enquiries · {row.bookings} viewings
                  </p>
                </div>
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
          You represent the platform for seller-owned properties. You do not create or own listings.
        </p>
      </div>
      <Suspense fallback={<Skeleton className="h-64 w-full rounded-3xl" />}>
        <BrokerOverview />
      </Suspense>
    </div>
  );
}
