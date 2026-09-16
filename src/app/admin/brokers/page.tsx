import { Suspense } from "react";

import { BrokerStatusControls } from "@/components/admin/moderation-controls";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { listBrokersWithStats } from "@/server/admin";

async function BrokersTable() {
  const brokers = await listBrokersWithStats();

  return (
    <div className="space-y-4">
      {brokers.length === 0 ? (
        <p className="text-sm text-muted-foreground">No broker accounts yet.</p>
      ) : (
        brokers.map((broker) => (
          <Card key={broker.id} className="rounded-3xl">
            <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
              <div>
                <CardTitle className="text-base">{broker.name}</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  {broker.email} · {broker.phone} · {broker.city}
                </p>
              </div>
              <Badge variant="outline" className="capitalize">
                {broker.status.replaceAll("_", " ")}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {broker.listings} listing{broker.listings === 1 ? "" : "s"}
                {broker.submittedAt
                  ? ` · submitted ${broker.submittedAt.toLocaleDateString()}`
                  : ""}
              </p>
              {broker.statusNote ? (
                <p className="text-sm text-muted-foreground">Note: {broker.statusNote}</p>
              ) : null}
              <BrokerStatusControls userId={broker.id} status={broker.status} />
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}

export default function AdminBrokersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Brokers</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Independent brokers — separate from agency firms.
        </p>
      </div>
      <Suspense fallback={<Skeleton className="h-64 w-full rounded-3xl" />}>
        <BrokersTable />
      </Suspense>
    </div>
  );
}
