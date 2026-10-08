import Link from "next/link";
import { Suspense } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ViewingInbox } from "@/components/viewings/viewing-inbox";
import { formatInZone, generateSlots } from "@/lib/viewings";
import { requireAuth } from "@/server/auth";
import { listSellerProperties } from "@/server/properties";

export const metadata = { title: "Viewings" };

async function SellerAvailability() {
  const session = await requireAuth();
  const listings = await listSellerProperties(session.user.id);

  if (listings.length === 0) return null;

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold">Availability</h2>
      {listings.map((row) => (
        <Card key={row.property.id} className="rounded-3xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base">{row.property.title}</CardTitle>
            <Button asChild size="sm" variant="outline" className="rounded-full">
              <Link href={`/seller/properties/${row.property.id}/edit`}>Edit</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {row.property.availabilityWindows.length === 0 ? (
              <p className="text-muted-foreground">No viewing windows posted yet.</p>
            ) : (
              row.property.availabilityWindows.map((window) => {
                const timezone = window.timezone || "UTC";
                const slots = generateSlots({
                  start: new Date(window.start),
                  end: new Date(window.end),
                  durationMin: window.durationMin,
                  bufferMin: window.bufferMin,
                });
                return (
                  <div key={window.start} className="rounded-2xl bg-muted/40 px-4 py-3">
                    <p className="font-medium">
                      {formatInZone(window.start, timezone, {
                        weekday: "long",
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                    <p className="mt-1 text-muted-foreground">
                      {formatInZone(window.start, timezone, { hour: "numeric", minute: "2-digit" })}{" "}
                      – {formatInZone(window.end, timezone, { hour: "numeric", minute: "2-digit" })}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {window.durationMin}-minute viewings · {window.bufferMin}-minute buffer ·{" "}
                      {slots.length} generated slot{slots.length === 1 ? "" : "s"}
                    </p>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function SellerViewingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Viewings</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Buyers book a generated slot from your windows. Approve to send it to the platform, or
          offer another posted slot.
        </p>
      </div>
      <Suspense fallback={<Skeleton className="h-40 w-full rounded-3xl" />}>
        <SellerAvailability />
      </Suspense>
      <Suspense fallback={<Skeleton className="h-64 w-full rounded-3xl" />}>
        <ViewingInbox emptyHref="/seller/properties" />
      </Suspense>
    </div>
  );
}
