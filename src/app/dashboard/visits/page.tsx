import { Card, CardContent } from "@/components/ui/card";

export default function VisitsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Scheduled visits</h1>
      <Card className="rounded-3xl">
        <CardContent className="p-8 text-sm text-muted-foreground">
          Calendar integrations (Google/Microsoft) mount here — show host assignments and driving directions.
        </CardContent>
      </Card>
    </div>
  );
}
