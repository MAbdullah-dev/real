import { Card, CardContent } from "@/components/ui/card";

export default function AdminReportsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Reports</h1>
      <Card className="rounded-3xl">
        <CardContent className="p-8 text-sm text-muted-foreground">
          Scheduled CSV / Parquet drops to your warehouse — dbt-ready schemas documented in `/docs/data`.
        </CardContent>
      </Card>
    </div>
  );
}
