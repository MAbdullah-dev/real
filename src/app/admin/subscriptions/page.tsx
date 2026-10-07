import { Suspense } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { listSubscriptionsWithUsage } from "@/server/subscriptions";

async function SubscriptionsTable() {
  const subscriptions = await listSubscriptionsWithUsage();

  if (subscriptions.length === 0) {
    return <p className="text-sm text-muted-foreground">No subscriptions yet.</p>;
  }

  const mrr = subscriptions
    .filter((sub) => sub.status === "active" || sub.status === "trialing")
    .reduce((total, sub) => total + sub.priceMonthly, 0);

  return (
    <div className="space-y-6">
      <Card className="rounded-3xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Monthly recurring revenue
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-semibold tabular-nums">${mrr.toLocaleString("en-US")}</p>
        </CardContent>
      </Card>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Agent</TableHead>
            <TableHead>Plan</TableHead>
            <TableHead className="text-right">Price</TableHead>
            <TableHead className="text-right">Listings</TableHead>
            <TableHead>Renews</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {subscriptions.map((sub) => (
            <TableRow key={sub.id}>
              <TableCell className="font-medium">
                {sub.userName}
                <p className="text-xs text-muted-foreground">{sub.userEmail}</p>
              </TableCell>
              <TableCell>{sub.planName}</TableCell>
              <TableCell className="text-right tabular-nums">${sub.priceMonthly}</TableCell>
              <TableCell className="text-right tabular-nums">
                {sub.listings}
                {sub.listingLimit != null ? ` / ${sub.listingLimit}` : ""}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {sub.currentPeriodEnd
                  ? sub.currentPeriodEnd.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  : "—"}
              </TableCell>
              <TableCell>
                <Badge
                  variant={sub.status === "active" ? "default" : "secondary"}
                  className="capitalize"
                >
                  {sub.status.replace("_", " ")}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default function AdminSubscriptionsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Subscriptions</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Plan mix, listing utilisation, and renewal dates.
        </p>
      </div>
      <Suspense fallback={<Skeleton className="h-64 w-full rounded-3xl" />}>
        <SubscriptionsTable />
      </Suspense>
    </div>
  );
}
