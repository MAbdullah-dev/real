import Link from "next/link";
import { Suspense } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { ViewingStatusBadge } from "@/components/viewings/viewing-meta";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatInZone } from "@/lib/viewings";
import { listAllBookings } from "@/server/bookings";

async function BookingMonitor() {
  const bookings = await listAllBookings();
  const queue = bookings.filter((row) => row.status === "pending_admin");

  if (bookings.length === 0) {
    return <p className="text-sm text-muted-foreground">No booking requests yet.</p>;
  }

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <h2 className="text-sm font-semibold">
          Needs platform review{" "}
          <span className="font-normal text-muted-foreground">({queue.length})</span>
        </h2>
        {queue.length === 0 ? (
          <p className="text-sm text-muted-foreground">No agreed times waiting on you.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Property</TableHead>
                <TableHead>Buyer</TableHead>
                <TableHead>Agreed time</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {queue.map((booking) => (
                <TableRow key={booking.id}>
                  <TableCell className="font-medium">{booking.property.title}</TableCell>
                  <TableCell>{booking.name}</TableCell>
                  <TableCell className="tabular-nums text-muted-foreground">
                    {booking.visitDate
                      ? formatInZone(booking.visitDate, booking.timezone)
                      : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Link
                      href={`/admin/bookings/${booking.id}`}
                      className="text-sm font-medium text-primary hover:underline"
                    >
                      Review
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold">All bookings</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Property</TableHead>
              <TableHead>Guest</TableHead>
              <TableHead>City</TableHead>
              <TableHead>Status</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bookings.map((booking) => (
              <TableRow key={booking.id}>
                <TableCell className="font-medium">{booking.property.title}</TableCell>
                <TableCell>
                  {booking.name}
                  <p className="text-xs text-muted-foreground">{booking.email}</p>
                </TableCell>
                <TableCell className="text-muted-foreground">{booking.property.city}</TableCell>
                <TableCell>
                  <ViewingStatusBadge status={booking.status} />
                  {booking.assignedBroker ? (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Broker: {booking.assignedBroker.name}
                    </p>
                  ) : null}
                </TableCell>
                <TableCell className="text-right">
                  <Link
                    href={`/admin/bookings/${booking.id}`}
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    Open
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>
    </div>
  );
}

export default function AdminBookingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Bookings</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Seller viewings land here after both sides agree a time. Accept, send a new time to both,
          then assign a city broker or continue without one.
        </p>
      </div>
      <Suspense fallback={<Skeleton className="h-64 w-full rounded-3xl" />}>
        <BookingMonitor />
      </Suspense>
    </div>
  );
}
