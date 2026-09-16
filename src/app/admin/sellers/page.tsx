import { Suspense } from "react";

import { SellerStatusControls } from "@/components/admin/moderation-controls";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { listSellersWithStats } from "@/server/admin";

async function SellersTable() {
  const sellers = await listSellersWithStats();

  return (
    <div className="space-y-4">
      {sellers.length === 0 ? (
        <p className="text-sm text-muted-foreground">No seller accounts yet.</p>
      ) : (
        sellers.map((seller) => (
          <Card key={seller.id} className="rounded-3xl">
            <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
              <div>
                <CardTitle className="text-base">{seller.name}</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  {seller.email} · {seller.phone} · {seller.city}
                </p>
              </div>
              <Badge variant="outline" className="capitalize">
                {seller.status.replaceAll("_", " ")}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {seller.listings} listing{seller.listings === 1 ? "" : "s"}
                {seller.submittedAt
                  ? ` · submitted ${seller.submittedAt.toLocaleDateString()}`
                  : ""}
              </p>
              {seller.statusNote ? (
                <p className="text-sm text-muted-foreground">Note: {seller.statusNote}</p>
              ) : null}
              <SellerStatusControls userId={seller.id} status={seller.status} />
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}

export default function AdminSellersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Sellers</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Review owner accounts before their listings can go live.
        </p>
      </div>
      <Suspense fallback={<Skeleton className="h-64 w-full rounded-3xl" />}>
        <SellersTable />
      </Suspense>
    </div>
  );
}
