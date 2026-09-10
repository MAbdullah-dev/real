import { CalendarRange } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

import { BookingStatusControls } from "@/components/agent/booking-status-controls";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { requireRole } from "@/server/auth";
import { listAgentBookings } from "@/server/bookings";

function toLocalInput(date: Date | null) {
  if (!date) return null;
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

async function BookingInbox() {
  const session = await requireRole(["AGENT", "ADMIN"]);
  const bookings = await listAgentBookings(session.user.id);

  if (bookings.length === 0) {
    return (
      <EmptyState
        icon={CalendarRange}
        title="No visit requests yet"
        description="Requests from your published listings land here with contact details."
        action={{ label: "Review listings", href: "/agent/properties" }}
      />
    );
  }

  return (
    <div className="space-y-3">
      {bookings.map((booking) => (
        <Card key={booking.id} className="rounded-2xl">
          <CardContent className="space-y-4 p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <Link
                  href={`/properties/${booking.property.slug}`}
                  className="font-medium hover:underline"
                >
                  {booking.property.title}
                </Link>
                <p className="mt-1 text-sm text-muted-foreground">
                  {booking.name} · {booking.email} · {booking.phone}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Preferred window: {booking.requestedDates}
                </p>
              </div>
              <Badge
                variant={booking.status === "confirmed" ? "default" : "secondary"}
                className="capitalize"
              >
                {booking.status}
              </Badge>
            </div>
            <p className="rounded-xl bg-muted/40 p-3 text-sm text-muted-foreground">
              {booking.notes}
            </p>
            <BookingStatusControls
              id={booking.id}
              status={booking.status}
              visitDate={toLocalInput(booking.visitDate)}
            />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function AgentBookingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Booking management</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Confirm a date or decline. The guest is notified either way.
        </p>
      </div>
      <Suspense fallback={<Skeleton className="h-64 w-full rounded-3xl" />}>
        <BookingInbox />
      </Suspense>
    </div>
  );
}
