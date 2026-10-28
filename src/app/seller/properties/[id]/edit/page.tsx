import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { uploadsConfigured } from "@/app/api/uploadthing/core";
import { DeletePropertyButton } from "@/components/agent/delete-property-button";
import { ListingReviewPanel } from "@/components/agent/listing-review-panel";
import { PropertyForm } from "@/components/agent/property-form";
import { Button } from "@/components/ui/button";
import { deleteSellerPropertyAction } from "@/server/actions/properties";
import { Skeleton } from "@/components/ui/skeleton";
import { getPropertyForEdit } from "@/server/properties";
import { requireActiveSellerForWrite } from "@/server/seller";

async function EditSellerPropertyContent({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ return?: string }>;
}) {
  const { id } = await params;
  const search = await searchParams;
  const backHref = listingsReturn(search.return);
  const { session, profile, isAdmin } = await requireActiveSellerForWrite();
  const property = await getPropertyForEdit(id);
  if (!property) notFound();
  if (!isAdmin && property.sellerId !== session.user.id) notFound();

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Edit listing</h1>
          <p className="mt-2 text-sm text-muted-foreground">Update photos, pricing, and details.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <DeletePropertyButton
            id={property.id}
            title={property.values.title}
            redirectTo={backHref}
            remove={deleteSellerPropertyAction}
          />
          <Button asChild variant="outline" className="rounded-full">
            <Link href={backHref}>Back to My Listings</Link>
          </Button>
        </div>
      </div>
      <ListingReviewPanel
        propertyId={property.id}
        status={property.status}
        actions={property.reviewHistory}
        canRequest={isAdmin || profile?.status === "active"}
        alwaysShow
        editHref="#listing-form"
        confirmResubmit
      />
      <div id="listing-form">
      <PropertyForm
        mode="edit"
        variant="seller"
        propertyId={property.id}
        defaultValues={property.values}
        canPublish={isAdmin}
        uploadsEnabled={uploadsConfigured}
        reviewLocked={property.status === "rejected"}
      />
      </div>
    </>
  );
}

function listingsReturn(value: string | undefined) {
  if (!value || !value.startsWith("/seller/properties") || value.startsWith("//")) {
    return "/seller/properties";
  }
  return value;
}

export default function EditSellerPropertyPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ return?: string }>;
}) {
  return (
    <div className="w-full max-w-none space-y-6">
      <Suspense fallback={<Skeleton className="h-96 w-full rounded-3xl" />}>
        <EditSellerPropertyContent params={params} searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
