import { ArrowLeft, MapPin, Phone } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { BuyerViewingActions } from "@/components/viewings/buyer-viewing-actions";
import {
  ViewingMeta,
  ViewingStatusBadge,
  ViewingTimeline,
} from "@/components/viewings/viewing-meta";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { telHref } from "@/lib/listing-contact";
import { VIEWING_STATUS_HINTS } from "@/lib/viewings";
import { requireAuth } from "@/server/auth";
import { getUserViewing } from "@/server/bookings";

export const metadata = { title: "Viewing details" };

export default async function BuyerViewingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireAuth();
  const viewing = await getUserViewing(id, session.user.id);
  if (!viewing) notFound();

  const hostName = viewing.property.agency?.name ?? viewing.property.agent.name;
  const hostPhone = viewing.property.agency?.phone;

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard/viewings"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        All viewings
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            <Link href={`/properties/${viewing.property.slug}`} className="hover:underline">
              {viewing.property.title}
            </Link>
          </h1>
          <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 shrink-0" aria-hidden />
            {viewing.property.address}, {viewing.property.city}
          </p>
        </div>
        <ViewingStatusBadge status={viewing.status} />
      </div>

      <Card className="rounded-3xl">
        <CardContent className="space-y-5 p-6">
          <p className="text-sm text-muted-foreground">
            {VIEWING_STATUS_HINTS[viewing.status]}
          </p>

          <ViewingMeta
            slots={viewing.slots}
            visitDate={viewing.visitDate}
            status={viewing.status}
            timezone={viewing.timezone}
            mode={viewing.mode}
            partySize={viewing.partySize}
          />

          {viewing.statusNote ? (
            <p className="rounded-xl bg-muted/50 px-3 py-2 text-sm">
              <span className="font-medium">Note from the listing contact:</span>{" "}
              <span className="text-muted-foreground">{viewing.statusNote}</span>
            </p>
          ) : null}

          {viewing.notes ? (
            <p className="rounded-xl border border-dashed border-border px-3 py-2 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">What you told them:</span>{" "}
              {viewing.notes}
            </p>
          ) : null}

          <Separator />

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Listing contact
              </p>
              <p className="mt-1 font-medium">{hostName ?? "Listing desk"}</p>
              {hostPhone ? (
                <a
                  href={telHref(hostPhone)}
                  className="mt-1 inline-flex items-center gap-1 text-sm text-primary hover:underline"
                >
                  <Phone className="h-3.5 w-3.5" aria-hidden />
                  {hostPhone}
                </a>
              ) : null}
            </div>
            <BuyerViewingActions id={viewing.id} status={viewing.status} />
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-3xl">
        <CardContent className="space-y-4 p-6">
          <h2 className="text-sm font-semibold">Activity</h2>
          <ViewingTimeline
            events={viewing.events}
            timezone={viewing.timezone}
            viewer="buyer"
          />
        </CardContent>
      </Card>
    </div>
  );
}
