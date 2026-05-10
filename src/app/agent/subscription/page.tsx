import { SUBSCRIPTION_PLANS } from "@/data/plans";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default function AgentSubscriptionPage() {
  const current = SUBSCRIPTION_PLANS[1];
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Subscription</h1>
        <p className="mt-2 text-sm text-muted-foreground">Plans, invoices, and listing caps.</p>
      </div>
      <Card className="rounded-3xl border-primary/30">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Current plan</CardTitle>
            <p className="mt-2 text-sm text-muted-foreground">{current.description}</p>
          </div>
          <Badge>Premium</Badge>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button asChild className="rounded-full">
            <Link href="/checkout">Upgrade</Link>
          </Button>
          <Button asChild variant="outline" className="rounded-full">
            <Link href="/checkout/invoice">Billing history</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
