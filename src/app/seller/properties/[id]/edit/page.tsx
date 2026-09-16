import { notFound } from "next/navigation";
import { Suspense } from "react";

import { uploadsConfigured } from "@/app/api/uploadthing/core";
import { PropertyForm } from "@/components/agent/property-form";
import { Skeleton } from "@/components/ui/skeleton";
import { getPropertyForEdit } from "@/server/properties";
import { requireActiveSellerForWrite } from "@/server/seller";

async function EditSellerPropertyContent({ id }: { id: string }) {
  const { session, profile, isAdmin } = await requireActiveSellerForWrite();
  const property = await getPropertyForEdit(id);
  if (!property) notFound();
  if (!isAdmin && property.sellerId !== session.user.id) notFound();

  return (
    <PropertyForm
      mode="edit"
      variant="seller"
      propertyId={property.id}
      defaultValues={property.values}
      canPublish={isAdmin || profile?.status === "active"}
      uploadsEnabled={uploadsConfigured}
    />
  );
}

export default async function EditSellerPropertyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Edit listing</h1>
        <p className="mt-2 text-sm text-muted-foreground">Update photos, pricing, and details.</p>
      </div>
      <Suspense fallback={<Skeleton className="h-96 w-full rounded-3xl" />}>
        <EditSellerPropertyContent id={id} />
      </Suspense>
    </div>
  );
}
