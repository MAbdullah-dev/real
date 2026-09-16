import Link from "next/link";
import { Suspense } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { listSellerProperties } from "@/server/properties";
import { getSellerListingAllowance, requireSeller } from "@/server/seller";

async function SellerOverview() {
  const { session, profile, isAdmin } = await requireSeller();
  if (!profile && !isAdmin) {
    return <p className="text-sm text-muted-foreground">Complete onboarding to open the console.</p>;
  }

  const [listings, allowance] = await Promise.all([
    listSellerProperties(session.user.id),
    getSellerListingAllowance(session.user.id),
  ]);

  const live = listings.filter((row) => row.status === "published").length;
  const draft = listings.filter((row) => row.status === "draft").length;

  return (
    <>
      {profile && profile.status !== "active" ? (
        <Card className="rounded-3xl border-amber-500/30 bg-amber-500/5">
          <CardContent className="py-4 text-sm">
            Seller status:{" "}
            <span className="font-medium capitalize">{profile.status.replaceAll("_", " ")}</span>
            {profile.status === "pending_review"
              ? " — you can draft listings, but they cannot go live until approval."
              : null}
            {profile.statusNote ? ` ${profile.statusNote}` : null}
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Live listings", value: live },
          { label: "Drafts", value: draft },
          { label: "Listing slots", value: `${allowance.used}/${allowance.limit}` },
        ].map((card) => (
          <Card key={card.label} className="rounded-3xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{card.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold tabular-nums">{card.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="rounded-3xl">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent listings</CardTitle>
          <Button asChild size="sm" className="rounded-full">
            <Link href="/seller/properties/new">Add property</Link>
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {listings.length === 0 ? (
            <p className="text-sm text-muted-foreground">No listings yet.</p>
          ) : (
            listings.slice(0, 5).map((row) => (
              <div key={row.property.id} className="flex items-center justify-between gap-3">
                <div>
                  <Link
                    href={`/seller/properties/${row.property.id}/edit`}
                    className="font-medium hover:underline"
                  >
                    {row.property.title}
                  </Link>
                  <p className="text-xs text-muted-foreground">{row.property.city}</p>
                </div>
                <Badge variant="outline" className="capitalize">
                  {row.status.replaceAll("_", " ")}
                </Badge>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </>
  );
}

export default function SellerHomePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Seller overview</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          List your property, manage drafts, and track approval status.
        </p>
      </div>
      <Suspense fallback={<Skeleton className="h-64 w-full rounded-3xl" />}>
        <SellerOverview />
      </Suspense>
    </div>
  );
}
