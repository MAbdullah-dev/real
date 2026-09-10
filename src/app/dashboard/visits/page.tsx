import { CalendarCheck } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { requireAuth } from "@/server/auth";
import { listUserVisits } from "@/server/bookings";

async function VisitList() {
  const session = await requireAuth();
  const visits = await listUserVisits(session.user.id);

  if (visits.length === 0) {
    return (
      <EmptyState
        icon={CalendarCheck}
        title="No confirmed visits"
        description="Once an agent confirms a request and sets a date, the visit appears here."
        action={{ label: "See booking requests", href: "/dashboard/bookings" }}
      />
    );
  }

  return (
    <div className="space-y-3">
      {visits.map((visit) => (
        <Card key={visit.id} className="rounded-2xl">
          <CardContent className="flex flex-wrap items-center justify-between gap-4 p-6">
            <div>
              <Link
                href={`/properties/${visit.property.slug}`}
                className="font-medium hover:underline"
              >
                {visit.property.title}
              </Link>
              <p className="mt-1 text-sm text-muted-foreground">
                {visit.property.city} · hosted by {visit.property.agent.name ?? "the listing desk"}
              </p>
            </div>
            <p className="text-sm font-medium tabular-nums">
              {visit.visitDate?.toLocaleString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function VisitsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Scheduled visits</h1>
      <Suspense fallback={<Skeleton className="h-48 w-full rounded-3xl" />}>
        <VisitList />
      </Suspense>
    </div>
  );
}
