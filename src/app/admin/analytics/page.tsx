import { Suspense } from "react";

import { ConversionChart, ViewsLeadsChart } from "@/components/charts/trend-charts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getAdminKpis, getDailyStats } from "@/server/analytics";

async function AnalyticsContent() {
  const [daily, kpis] = await Promise.all([getDailyStats(30), getAdminKpis()]);

  const conversion = daily.map((point) => ({
    label: point.label,
    conv: point.views > 0 ? Math.round((point.leads / point.views) * 1000) / 10 : 0,
  }));

  const cards = [
    { label: "Total bookings", value: kpis.bookings },
    { label: "Pending review", value: kpis.pendingReview },
    { label: "Active subscriptions", value: kpis.activeSubscriptions },
    { label: "Plans", value: kpis.plans },
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
        <CardHeader>
          <CardTitle>Views vs enquiries · last 30 days</CardTitle>
        </CardHeader>
        <CardContent className="h-80">
          <ViewsLeadsChart data={daily} />
        </CardContent>
      </Card>

      <Card className="rounded-3xl">
        <CardHeader>
          <CardTitle>View → enquiry conversion</CardTitle>
        </CardHeader>
        <CardContent className="h-80">
          <ConversionChart data={conversion} />
        </CardContent>
      </Card>
    </>
  );
}

export default function AdminAnalyticsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
      <Suspense fallback={<Skeleton className="h-96 w-full rounded-3xl" />}>
        <AnalyticsContent />
      </Suspense>
    </div>
  );
}
