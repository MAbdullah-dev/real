import Link from "next/link";
import { Suspense } from "react";

import { uploadsConfigured } from "@/app/api/uploadthing/core";
import { emptyPropertyForm, PropertyForm } from "@/components/agent/property-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getBrokerListingAllowance, requireActiveBrokerForWrite } from "@/server/broker";

async function NewBrokerPropertyContent() {
  const { session, profile, isAdmin } = await requireActiveBrokerForWrite();
  const allowance = await getBrokerListingAllowance(session.user.id);

  if (!isAdmin && !allowance.canCreate) {
    return (
      <Card className="rounded-3xl border-primary/30">
        <CardContent className="space-y-4 p-8">
          <h2 className="text-lg font-semibold">Listing limit reached</h2>
          <p className="text-sm text-muted-foreground">
            Brokers can keep {allowance.limit} listings. Remove one to add another.
          </p>
          <Button asChild variant="outline" className="rounded-full">
            <Link href="/broker/properties">Manage listings</Link>
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
            Your broker account is under review — drafts are allowed; live publish waits for
            approval.
          </CardContent>
        </Card>
      ) : null}
      <PropertyForm
        mode="create"
        variant="broker"
        defaultValues={emptyPropertyForm}
        canPublish={isAdmin || profile?.status === "active"}
        uploadsEnabled={uploadsConfigured}
      />
    </>
  );
}

export default function NewBrokerPropertyPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Add listing</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Represent a property and help buyers and sellers through the deal.
        </p>
      </div>
      <Suspense fallback={<Skeleton className="h-96 w-full rounded-3xl" />}>
        <NewBrokerPropertyContent />
      </Suspense>
    </div>
  );
}
