import Link from "next/link";
import { Suspense } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/server/auth";
import { listNotifications } from "@/server/notifications";

async function Overview() {
  const session = await requireAuth();
  const userId = session.user.id;

  const [saved, activeRequests, upcomingVisits, activity] = await Promise.all([
    prisma.wishlistItem.count({ where: { userId } }),
    prisma.booking.count({ where: { userId, status: "pending" } }),
    prisma.booking.count({
      where: { userId, status: "confirmed", visitDate: { gte: new Date() } },
    }),
    listNotifications(userId, 5),
  ]);

  const kpis = [
    { label: "Saved", value: saved, href: "/dashboard/saved" },
    { label: "Active requests", value: activeRequests, href: "/dashboard/bookings" },
    { label: "Upcoming visits", value: upcomingVisits, href: "/dashboard/visits" },
  ];

  return (
    <>
      <div className="grid gap-4 md:grid-cols-3">
        {kpis.map((kpi) => (
          <Link key={kpi.label} href={kpi.href} className="group">
            <Card className="rounded-3xl transition-colors group-hover:border-primary/40">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {kpi.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold tabular-nums">{kpi.value}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <Card className="rounded-3xl">
        <CardHeader>
          <CardTitle>Activity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {activity.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nothing yet. Save a listing or request a visit to get started.
            </p>
          ) : (
            activity.map((item) => (
              <div key={item.id} className="rounded-2xl border border-border p-4">
                <div className="flex items-center justify-between gap-4">
                  <p className="text-sm font-medium">{item.title}</p>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {item.createdAt.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{item.body}</p>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </>
  );
}

function OverviewFallback() {
  return (
    <>
      <div className="grid gap-4 md:grid-cols-3">
        <Skeleton className="h-28 rounded-3xl" />
        <Skeleton className="h-28 rounded-3xl" />
        <Skeleton className="h-28 rounded-3xl" />
      </div>
      <Skeleton className="h-64 w-full rounded-3xl" />
    </>
  );
}

export default function UserOverviewPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your saved homes, visit pipeline, and recent updates.
        </p>
      </div>
      <Suspense fallback={<OverviewFallback />}>
        <Overview />
      </Suspense>
    </div>
  );
}
