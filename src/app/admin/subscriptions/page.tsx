import { Card, CardContent } from "@/components/ui/card";

export default function AdminSubscriptionsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Subscriptions</h1>
      <Card className="rounded-3xl">
        <CardContent className="p-8 text-sm text-muted-foreground">
          MRR bridges, churn cohorts, and plan migration audit trail — connect to Stripe Billing exports.
        </CardContent>
      </Card>
    </div>
  );
}
