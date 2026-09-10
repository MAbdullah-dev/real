import { CalendarRange } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

import { Badge } from "@/components/ui/badge";
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
import { requireAuth } from "@/server/auth";
import { listUserBookings } from "@/server/bookings";

const statusVariant: Record<string, "default" | "secondary" | "outline"> = {
  confirmed: "default",
  completed: "outline",
  pending: "secondary",
  declined: "outline",
};

function formatDate(value: Date) {
  return value.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

async function BookingsTable() {
  const session = await requireAuth();
  const bookings = await listUserBookings(session.user.id);

  if (bookings.length === 0) {
    return (
      <EmptyState
        icon={CalendarRange}
        title="No visit requests yet"
        description="Request a private visit from any listing and it will show up here."
        action={{ label: "Browse properties", href: "/search" }}
      />
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Property</TableHead>
          <TableHead>Requested</TableHead>
          <TableHead>Preferred window</TableHead>
          <TableHead>Visit date</TableHead>
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
              <p className="text-xs text-muted-foreground">{booking.property.city}</p>
            </TableCell>
            <TableCell className="text-muted-foreground">
              {formatDate(booking.createdAt)}
            </TableCell>
            <TableCell className="text-muted-foreground">{booking.requestedDates}</TableCell>
            <TableCell className="text-muted-foreground">
              {booking.visitDate ? formatDate(booking.visitDate) : "—"}
            </TableCell>
            <TableCell>
              <Badge variant={statusVariant[booking.status] ?? "secondary"} className="capitalize">
                {booking.status}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export default function UserBookingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Booking requests</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Every private visit you have asked for, and where each one stands.
        </p>
      </div>
      <Suspense fallback={<Skeleton className="h-64 w-full rounded-3xl" />}>
        <BookingsTable />
      </Suspense>
    </div>
  );
}
