import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { AdminViewingControls } from "@/components/admin/admin-viewing-controls";
import { ViewingMeta, ViewingStatusBadge, ViewingTimeline } from "@/components/viewings/viewing-meta";
import { Skeleton } from "@/components/ui/skeleton";
import { listBrokersForCity } from "@/server/actions/bookings";
import { requireRole } from "@/server/auth";
import { getBookingForAdmin } from "@/server/bookings";

export const metadata = { title: "Review viewing" };

export default function AdminBookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <div className="space-y-6">
      <Link href="/admin/bookings" className="text-sm text-muted-foreground hover:text-foreground">
        ← All bookings
      </Link>
      <Suspense fallback={<Skeleton className="h-96 w-full rounded-3xl" />}>
        <BookingDetail params={params} />
      </Suspense>
    </div>
  );
}

async function BookingDetail({ params }: { params: Promise<{ id: string }> }) {
  await requireRole(["ADMIN"]);
  const { id } = await params;
  const booking = await getBookingForAdmin(id);
  if (!booking) notFound();

  const roster = await listBrokersForCity(booking.property.city);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{booking.property.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {booking.name} · {booking.email} · {booking.property.city}
          </p>
        </div>
        <ViewingStatusBadge status={booking.status} />
      </div>

      <ViewingMeta
        slots={booking.slots}
        visitDate={booking.visitDate}
        status={booking.status}
        timezone={booking.timezone}
        mode={booking.mode}
        partySize={booking.partySize}
      />

      {booking.assignedBroker ? (
        <p className="text-sm">
          Assigned broker:{" "}
          <span className="font-medium">{booking.assignedBroker.name ?? booking.assignedBroker.email}</span>
        </p>
      ) : null}

      <AdminViewingControls
        id={booking.id}
        status={booking.status}
        visitDate={booking.visitDate?.toISOString() ?? null}
        assignedBrokerId={booking.assignedBrokerId}
        city={booking.property.city}
        fallback={roster.fallback}
        brokers={roster.brokers}
      />

      <ViewingTimeline events={booking.events} timezone={booking.timezone} viewer="host" />
    </div>
  );
}
