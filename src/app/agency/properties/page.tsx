import Link from "next/link";
import { Building2 } from "lucide-react";
import { Suspense } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatPrice } from "@/lib/utils";
import { requireAgency } from "@/server/agency";
import { listAgentProperties } from "@/server/properties";
import { getListingAllowance } from "@/server/subscriptions";

const statusLabel: Record<string, string> = {
  draft: "Draft",
  pending_review: "Pending review",
  published: "Published",
  rejected: "Rejected",
};

async function AgentPropertiesTable() {
  const { session, agency } = await requireAgency();
  if (!agency) {
    return <p className="text-sm text-muted-foreground">Complete onboarding first.</p>;
  }

  const [listings, allowance] = await Promise.all([
    listAgentProperties({ agencyId: agency.id }),
    getListingAllowance(session.user.id),
  ]);

  if (listings.length === 0) {
    return (
      <EmptyState
        icon={Building2}
        title="No listings yet"
        description="Create your first listing to start collecting visit requests."
        action={{ label: "Add property", href: "/agency/properties/new" }}
      />
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {allowance.limit == null
          ? `${allowance.planName} plan · unlimited listings`
          : `${allowance.planName} plan · ${allowance.used} of ${allowance.limit} listings used`}
      </p>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>City</TableHead>
            <TableHead className="text-right">Price</TableHead>
            <TableHead className="text-right">Requests</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {listings.map(({ property, status, bookings, leads }) => (
            <TableRow key={property.id}>
              <TableCell className="font-medium">{property.title}</TableCell>
              <TableCell>{property.city}</TableCell>
              <TableCell className="text-right tabular-nums">
                {formatPrice(property.price)}
              </TableCell>
              <TableCell className="text-right tabular-nums">{bookings + leads}</TableCell>
              <TableCell>
                <Badge variant={status === "published" ? "default" : "secondary"}>
                  {statusLabel[status] ?? status}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <Button asChild variant="ghost" size="sm" className="rounded-full">
                  <Link href={`/agency/properties/${property.id}/edit`}>Edit</Link>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default function AgentPropertiesPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Properties</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Your portfolio with review status and inbound request volume.
          </p>
        </div>
        <Button asChild className="rounded-full">
          <Link href="/agency/properties/new">Add property</Link>
        </Button>
      </div>
      <Suspense fallback={<Skeleton className="h-64 w-full rounded-3xl" />}>
        <AgentPropertiesTable />
      </Suspense>
    </div>
  );
}
