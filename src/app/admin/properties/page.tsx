import Link from "next/link";
import { Suspense } from "react";

import { PropertyModerationControls } from "@/components/admin/moderation-controls";
import { Badge } from "@/components/ui/badge";
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
import { listAgentProperties } from "@/server/properties";

const statusLabel: Record<string, string> = {
  draft: "Draft",
  pending_review: "Pending review",
  published: "Published",
  rejected: "Rejected",
};

async function ApprovalsTable() {
  const listings = await listAgentProperties();
  const pending = listings.filter((item) => item.status === "pending_review").length;

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {pending} listing{pending === 1 ? "" : "s"} awaiting review · {listings.length} total
      </p>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Agent</TableHead>
            <TableHead>City</TableHead>
            <TableHead className="text-right">Price</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Review</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {listings.map(({ property, status, agentName }) => (
            <TableRow key={property.id}>
              <TableCell className="font-medium">
                <Link href={`/properties/${property.slug}`} className="hover:underline">
                  {property.title}
                </Link>
              </TableCell>
              <TableCell className="text-muted-foreground">{agentName}</TableCell>
              <TableCell>{property.city}</TableCell>
              <TableCell className="text-right tabular-nums">
                {formatPrice(property.price)}
              </TableCell>
              <TableCell>
                <Badge variant={status === "published" ? "default" : "secondary"}>
                  {statusLabel[status] ?? status}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <PropertyModerationControls id={property.id} status={status} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default function AdminPropertiesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Property approvals</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Publish, unpublish, or reject listings. The agent is notified on every change.
        </p>
      </div>
      <Suspense fallback={<Skeleton className="h-64 w-full rounded-3xl" />}>
        <ApprovalsTable />
      </Suspense>
    </div>
  );
}
