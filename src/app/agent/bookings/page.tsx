import { Card, CardContent } from "@/components/ui/card";

export default function AgentBookingsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Booking management</h1>
      <Card className="rounded-3xl">
        <CardContent className="p-8 text-sm text-muted-foreground">
          Lead inbox with SLA timers, reassignment, and voice call logging — connect to your telephony provider.
        </CardContent>
      </Card>
    </div>
  );
}
