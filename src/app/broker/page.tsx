import Link from "next/link";
import { Suspense } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatInZone } from "@/lib/viewings";
import { countHostEnquiries, countHostViewings, listHostViewings } from "@/server/bookings";
import { requireBroker } from "@/server/broker";

async function BrokerOverview() {
  const { session, profile, isAdmin } = await requireBroker();
  if (!profile && !isAdmin) {
    return <p className="text-sm text-muted-foreground">Complete onboarding to open the console.</p>;
  }

  const [assignedViewings, confirmedCount, openEnquiries] = await Promise.all([
    listHostViewings(session.user.id, session.user.role),
    countHostViewings(session.user.id, session.user.role, "confirmed"),
    countHostEnquiries(session.user.id, session.user.role, "open"),
  ]);
  const openAssigned = assignedViewings.filter((row) => row.status === "confirmed");

  return (
    <>
      {profile && profile.status !== "active" ? (
        <Card className="rounded-3xl border-amber-500/30 bg-amber-500/5">
          <CardContent className="py-4 text-sm">
            Broker status:{" "}
            <span className="font-medium capitalize">{profile.status.replaceAll("_", " ")}</span>
            {profile.status === "pending_review"
              ? " — assigned viewings appear here after approval."
              : null}
            {profile.statusNote ? ` ${profile.statusNote}` : null}
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Assigned viewings", value: assignedViewings.length },
          { label: "Confirmed upcoming", value: confirmedCount },
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
          <CardTitle>Assigned viewings</CardTitle>
          <Button asChild size="sm" variant="outline" className="rounded-full">
            <Link href="/broker/viewings">Open viewings</Link>
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {openAssigned.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              When an admin assigns you a confirmed viewing, the listing and accepted time appear
              here.
            </p>
          ) : (
            openAssigned.slice(0, 5).map((row) => (
              <div key={row.id} className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium">{row.property.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {row.property.city}
                    {row.visitDate
                      ? ` · ${formatInZone(row.visitDate, row.timezone)}`
                      : " · time confirmed"}
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
          Assigned viewings only. You do not create listings or pick up unassigned seller requests.
        </p>
      </div>
      <Suspense fallback={<Skeleton className="h-64 w-full rounded-3xl" />}>
        <BrokerOverview />
      </Suspense>
    </div>
  );
}
