import Link from "next/link";
import { Suspense } from "react";

import { uploadsConfigured } from "@/app/api/uploadthing/core";
import { emptyPropertyForm, PropertyForm } from "@/components/agent/property-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getSellerListingAllowance, requireActiveSellerForWrite } from "@/server/seller";

async function NewSellerPropertyContent() {
  const { session, profile, isAdmin } = await requireActiveSellerForWrite();
  const allowance = await getSellerListingAllowance(session.user.id);

  if (!isAdmin && !allowance.canCreate) {
    return (
      <Card className="rounded-3xl border-primary/30">
        <CardContent className="space-y-4 p-8">
          <h2 className="text-lg font-semibold">Listing limit reached</h2>
          <p className="text-sm text-muted-foreground">
            Sellers can keep {allowance.limit} listings. Remove one to add another.
          </p>
          <Button asChild variant="outline" className="rounded-full">
            <Link href="/seller/properties">Manage listings</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {!isAdmin && profile?.status === "pending_review" ? (
        <Card className="rounded-3xl border-amber-500/30 bg-amber-500/5">
          <CardContent className="py-4 text-sm text-muted-foreground">
            Your seller account is still under review — you can save drafts, but listings cannot go
            live until approval.
          </CardContent>
        </Card>
      ) : null}
      <p className="text-sm text-muted-foreground">
        {allowance.used} of {allowance.limit} seller listing slots used
      </p>
      <PropertyForm
        mode="create"
        variant="seller"
        defaultValues={emptyPropertyForm}
        canPublish={isAdmin || profile?.status === "active"}
        uploadsEnabled={uploadsConfigured}
      />
    </>
  );
}

export default function NewSellerPropertyPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">List your property</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          You own this listing. Buyers contact you directly after it is approved.
        </p>
      </div>
      <Suspense fallback={<Skeleton className="h-96 w-full rounded-3xl" />}>
        <NewSellerPropertyContent />
      </Suspense>
    </div>
  );
}
