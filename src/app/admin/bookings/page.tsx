import Link from "next/link";
import { Suspense } from "react";

import { AdminViewingControls } from "@/components/admin/admin-viewing-controls";
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
import { listActiveBrokers } from "@/server/broker";

async function BookingMonitor() {
  const [bookings, brokers] = await Promise.all([listAllBookings(), listActiveBrokers()]);

  if (bookings.length === 0) {
    return <p className="text-sm text-muted-foreground">No viewing requests yet.</p>;
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Seller-owned viewings wait here after the buyer and owner agree. Accept the time, then
        optionally assign a broker in that city.
      </p>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Property</TableHead>
            <TableHead>Guest</TableHead>
            <TableHead>Time</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {bookings.map((booking) => {
            const city = booking.property.city;
            const inCity = brokers.all.filter(
              (broker) => (broker.city ?? "").trim().toLowerCase() === city.trim().toLowerCase()
            );
            const options = (list: typeof brokers.all) =>
              list.map((broker) => ({
                userId: broker.userId,
                name: broker.user.name ?? broker.user.email ?? "Broker",
                city: broker.city,
              }));

            return (
              <TableRow key={booking.id} className="align-top">
                <TableCell className="font-medium">
                  <Link href={`/properties/${booking.property.slug}`} className="hover:underline">
                    {booking.property.title}
                  </Link>
                  <p className="text-xs text-muted-foreground">{city}</p>
                  {booking.assignedBroker ? (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Broker: {booking.assignedBroker.name ?? booking.assignedBroker.email}
                    </p>
                  ) : null}
                </TableCell>
                <TableCell>
                  {booking.name}
                  <p className="text-xs text-muted-foreground">{booking.email}</p>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {booking.visitDate
                    ? formatInZone(booking.visitDate, booking.timezone)
                    : "—"}
                </TableCell>
                <TableCell>
                  <ViewingStatusBadge status={booking.status} />
                </TableCell>
                <TableCell className="min-w-[20rem]">
                  {booking.property.sellerId ? (
                    <AdminViewingControls
                      id={booking.id}
                      status={booking.status}
                      visitDate={booking.visitDate?.toISOString() ?? null}
                      assignedBrokerId={booking.assignedBrokerId}
                      city={city}
                      brokersInCity={options(inCity)}
                      allBrokers={options(brokers.all)}
                    />
                  ) : (
                    <p className="text-xs text-muted-foreground">Agency listing — handled by the firm.</p>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

export default function AdminBookingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Viewings</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Confirm agreed times, reschedule, and assign a city broker when you want one.
        </p>
      </div>
      <Suspense fallback={<Skeleton className="h-64 w-full rounded-3xl" />}>
        <BookingMonitor />
      </Suspense>
    </div>
  );
}
