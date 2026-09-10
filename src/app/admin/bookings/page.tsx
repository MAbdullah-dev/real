import Link from "next/link";
import { Suspense } from "react";

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
import { listAllBookings } from "@/server/bookings";

async function BookingMonitor() {
  const bookings = await listAllBookings();

  if (bookings.length === 0) {
    return <p className="text-sm text-muted-foreground">No booking requests yet.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Property</TableHead>
          <TableHead>Guest</TableHead>
          <TableHead>Agent</TableHead>
          <TableHead>Requested</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {bookings.map((booking) => (
          <TableRow key={booking.id}>
            <TableCell className="font-medium">
              <Link href={`/properties/${booking.property.slug}`} className="hover:underline">
                {booking.property.title}
              </Link>
            </TableCell>
            <TableCell>
              {booking.name}
              <p className="text-xs text-muted-foreground">{booking.email}</p>
            </TableCell>
            <TableCell className="text-muted-foreground">
              {booking.property.agent.name ?? "—"}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {booking.createdAt.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </TableCell>
            <TableCell>
              <Badge
                variant={booking.status === "confirmed" ? "default" : "secondary"}
                className="capitalize"
              >
                {booking.status}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export default function AdminBookingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Bookings</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Every visit request across the marketplace.
        </p>
      </div>
      <Suspense fallback={<Skeleton className="h-64 w-full rounded-3xl" />}>
        <BookingMonitor />
      </Suspense>
    </div>
  );
}
