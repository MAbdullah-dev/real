import { notFound } from "next/navigation";
import { Suspense } from "react";

import { uploadsConfigured } from "@/app/api/uploadthing/core";
import { PropertyForm } from "@/components/agent/property-form";
import { Skeleton } from "@/components/ui/skeleton";
import { requireActiveBrokerForWrite } from "@/server/broker";
import { getPropertyForEdit } from "@/server/properties";

async function EditBrokerPropertyContent({ id }: { id: string }) {
  const { session, profile, isAdmin } = await requireActiveBrokerForWrite();
  const property = await getPropertyForEdit(id);
  if (!property) notFound();
  if (
    !isAdmin &&
    (property.agentId !== session.user.id || property.agencyId || property.sellerId)
  ) {
    notFound();
  }

  return (
    <PropertyForm
      mode="edit"
      variant="broker"
      propertyId={property.id}
      defaultValues={property.values}
      canPublish={isAdmin || profile?.status === "active"}
      uploadsEnabled={uploadsConfigured}
    />
  );
}

export default async function EditBrokerPropertyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Edit listing</h1>
        <p className="mt-2 text-sm text-muted-foreground">Update details for a property you represent.</p>
      </div>
      <Suspense fallback={<Skeleton className="h-96 w-full rounded-3xl" />}>
        <EditBrokerPropertyContent id={id} />
      </Suspense>
    </div>
  );
}
