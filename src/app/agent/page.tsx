import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MOCK_PROPERTIES } from "@/data/properties";

const kpis = [
  { label: "Active listings", value: MOCK_PROPERTIES.length },
  { label: "Visit requests", value: 18 },
  { label: "Conversion", value: "34%" },
];

export default function AgentOverviewPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Agent overview</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Performance, pipeline health, and subscription utilization.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {kpis.map((k) => (
          <Card key={k.label} className="rounded-3xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{k.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold tabular-nums">{k.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card className="rounded-3xl">
        <CardHeader>
          <CardTitle>Booking pipeline</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Kanban stages (New → Qualifying → Scheduled → Completed) plug into the same API as admin reporting.
        </CardContent>
      </Card>
    </div>
  );
}
