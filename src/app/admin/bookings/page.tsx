import { Card, CardContent } from "@/components/ui/card";

export default function AdminBookingsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Bookings</h1>
      <Card className="rounded-3xl">
        <CardContent className="p-8 text-sm text-muted-foreground">
          Global booking monitor with reassignment, SLA breaches, and voice transcripts.
        </CardContent>
      </Card>
    </div>
  );
}
