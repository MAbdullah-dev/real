import Link from "next/link";
import { Suspense } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPrice } from "@/lib/utils";
import { listSellerProperties } from "@/server/properties";
import { requireSeller } from "@/server/seller";

async function SellerListings() {
  const { session } = await requireSeller();
  const listings = await listSellerProperties(session.user.id);

  if (listings.length === 0) {
    return (
      <Card className="rounded-3xl">
        <CardContent className="space-y-4 p-8 text-center">
          <p className="text-sm text-muted-foreground">You haven&apos;t listed a property yet.</p>
          <Button asChild className="rounded-full">
            <Link href="/seller/properties/new">Add your first listing</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {listings.map((row) => (
        <Card key={row.property.id} className="rounded-3xl">
          <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
            <div>
              <Link
                href={`/seller/properties/${row.property.id}/edit`}
                className="font-medium hover:underline"
              >
                {row.property.title}
              </Link>
              <p className="mt-1 text-sm text-muted-foreground">
                {row.property.city} · {formatPrice(row.property.price)}
              </p>
            </div>
            <Badge variant="outline" className="capitalize">
              {row.status.replaceAll("_", " ")}
            </Badge>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function SellerPropertiesPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">My listings</h1>
          <p className="mt-2 text-sm text-muted-foreground">Homes you own and manage directly.</p>
        </div>
        <Button asChild className="rounded-full">
          <Link href="/seller/properties/new">Add property</Link>
        </Button>
      </div>
      <Suspense fallback={<Skeleton className="h-48 w-full rounded-3xl" />}>
        <SellerListings />
      </Suspense>
    </div>
  );
}
