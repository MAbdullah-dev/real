import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { uploadsConfigured } from "@/app/api/uploadthing/core";
import { DeletePropertyButton } from "@/components/agent/delete-property-button";
import { PropertyForm } from "@/components/agent/property-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { requireRole } from "@/server/auth";
import { getPropertyForEdit } from "@/server/properties";

const statusLabel: Record<string, string> = {
  draft: "Draft",
  pending_review: "Pending review",
  published: "Published",
  rejected: "Rejected",
};

async function EditPropertyContent({ id }: { id: string }) {
  const session = await requireRole(["AGENT", "ADMIN"]);
  const record = await getPropertyForEdit(id);
  if (!record) notFound();

  const isAdmin = session.user.role === "ADMIN";
  if (!isAdmin && record.agentId !== session.user.id) notFound();

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <Badge variant={record.status === "published" ? "default" : "secondary"}>
          {statusLabel[record.status] ?? record.status}
        </Badge>
        {record.status === "published" ? (
          <Button asChild variant="ghost" size="sm" className="rounded-full">
            <Link href={`/properties/${record.slug}`}>View public page</Link>
          </Button>
        ) : null}
        <DeletePropertyButton id={record.id} />
      </div>
      <PropertyForm
        mode="edit"
        propertyId={record.id}
        defaultValues={record.values}
        canPublish={isAdmin}
        uploadsEnabled={uploadsConfigured}
      />
    </>
  );
}

export default async function EditPropertyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Edit property</h1>
        <Button asChild variant="outline" className="rounded-full">
          <Link href="/agent/properties">Back</Link>
        </Button>
      </div>
      <Suspense fallback={<Skeleton className="h-96 w-full rounded-3xl" />}>
        <EditPropertyContent id={id} />
      </Suspense>
    </div>
  );
}
