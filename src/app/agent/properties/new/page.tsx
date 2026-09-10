import Link from "next/link";
import { Suspense } from "react";

import { uploadsConfigured } from "@/app/api/uploadthing/core";
import { emptyPropertyForm, PropertyForm } from "@/components/agent/property-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { requireRole } from "@/server/auth";
import { getListingAllowance } from "@/server/subscriptions";

async function NewPropertyContent() {
  const session = await requireRole(["AGENT", "ADMIN"]);
  const isAdmin = session.user.role === "ADMIN";
  const allowance = await getListingAllowance(session.user.id);

  if (!isAdmin && !allowance.canCreate) {
    return (
      <Card className="rounded-3xl border-primary/30">
        <CardContent className="space-y-4 p-8">
          <h2 className="text-lg font-semibold">Listing limit reached</h2>
          <p className="text-sm text-muted-foreground">
            The {allowance.planName} plan covers {allowance.limit} listing
            {allowance.limit === 1 ? "" : "s"} and you are using {allowance.used}. Upgrade your plan
            or archive an existing listing to add another.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild className="rounded-full">
              <Link href="/agent/subscription">Upgrade plan</Link>
            </Button>
            <Button asChild variant="outline" className="rounded-full">
              <Link href="/agent/properties">Manage listings</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <p className="text-sm text-muted-foreground">
        {allowance.limit == null
          ? `${allowance.planName} plan · unlimited listings`
          : `${allowance.planName} plan · ${allowance.used} of ${allowance.limit} listings used`}
      </p>
      <PropertyForm
        mode="create"
        defaultValues={emptyPropertyForm}
        canPublish={isAdmin}
        uploadsEnabled={uploadsConfigured}
      />
    </>
  );
}

export default function NewPropertyPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Add property</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Photos, pricing, and categorisation. Submit for review when the listing is ready.
        </p>
      </div>
      <Suspense fallback={<Skeleton className="h-96 w-full rounded-3xl" />}>
        <NewPropertyContent />
      </Suspense>
    </div>
  );
}
