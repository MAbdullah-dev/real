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

  const [saved, awaitingReply, needsYou, upcomingVisits, replies, activity] =
    await Promise.all([
      prisma.wishlistItem.count({ where: { userId } }),
      prisma.booking.count({ where: { userId, status: "pending" } }),
      prisma.booking.count({ where: { userId, status: "proposed" } }),
      prisma.booking.count({
        where: { userId, status: "confirmed", visitDate: { gte: new Date() } },
      }),
      prisma.lead.count({ where: { userId, status: "replied" } }),
      listNotifications(userId, 5),
    ]);

  const kpis = [
    { label: "Saved", value: saved, href: "/dashboard/saved" },
    { label: "Awaiting reply", value: awaitingReply, href: "/dashboard/viewings" },
    { label: "Upcoming visits", value: upcomingVisits, href: "/dashboard/viewings" },
    { label: "New replies", value: replies, href: "/dashboard/messages" },
  ];

  return (
    <>
      {needsYou > 0 ? (
        <Link href="/dashboard/viewings" className="block">
          <Card className="rounded-3xl border-primary/40 bg-primary/5 transition-colors hover:border-primary">
            <CardContent className="py-4 text-sm">
              <span className="font-medium">
                {needsYou === 1
                  ? "A listing contact offered a different time"
                  : `${needsYou} listing contacts offered different times`}
              </span>{" "}
              — accept it or propose another. →
            </CardContent>
          </Card>
        </Link>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
            activity.map((item) => {
              const body = (
                <>
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
                </>
              );
              return item.href ? (
                <Link
                  key={item.id}
                  href={item.href}
                  className="block rounded-2xl border border-border p-4 transition-colors hover:border-primary/40"
                >
                  {body}
                </Link>
              ) : (
                <div key={item.id} className="rounded-2xl border border-border p-4">
                  {body}
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </>
  );
}

function OverviewFallback() {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-28 rounded-3xl" />
        ))}
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
