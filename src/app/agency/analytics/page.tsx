import { Suspense } from "react";

import { ViewsLeadsChart } from "@/components/charts/trend-charts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { requireAgency } from "@/server/agency";
import { getAgentKpis, getDailyStats } from "@/server/analytics";

async function AnalyticsContent() {
  const { agency } = await requireAgency();
  if (!agency) {
    return <p className="text-sm text-muted-foreground">Complete onboarding first.</p>;
  }

  const [data, kpis] = await Promise.all([
    getDailyStats(14, agency.id),
    getAgentKpis(agency.id),
  ]);

  const cards = [
    { label: "Listing views", value: kpis.views },
    { label: "Visit requests", value: kpis.bookings },
    { label: "Enquiries", value: kpis.leads },
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
              <p className="text-2xl font-semibold tabular-nums">{card.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card className="rounded-3xl">
        <CardHeader>
          <CardTitle>Views vs enquiries · last 14 days</CardTitle>
        </CardHeader>
        <CardContent className="h-80">
          <ViewsLeadsChart data={data} />
        </CardContent>
      </Card>
    </>
  );
}

export default function AgentAnalyticsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Traffic and enquiry volume across your listings.
        </p>
      </div>
      <Suspense fallback={<Skeleton className="h-96 w-full rounded-3xl" />}>
        <AnalyticsContent />
      </Suspense>
    </div>
  );
}
