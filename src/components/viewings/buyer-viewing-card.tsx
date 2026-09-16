import { MapPin } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { BuyerViewingActions } from "@/components/viewings/buyer-viewing-actions";
import { ViewingMeta, ViewingStatusBadge } from "@/components/viewings/viewing-meta";
import { Card, CardContent } from "@/components/ui/card";
import { VIEWING_STATUS_HINTS } from "@/lib/viewings";
import type { ViewingRow } from "@/server/bookings";

export function BuyerViewingCard({ viewing }: { viewing: ViewingRow }) {
  const cover = viewing.property.images[0]?.url;

  return (
    <Card className="rounded-3xl">
      <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:gap-5 sm:p-6">
        {cover ? (
          <Link
            href={`/properties/${viewing.property.slug}`}
            className="relative block h-36 w-full shrink-0 overflow-hidden rounded-2xl sm:h-28 sm:w-40"
          >
            <Image
              src={cover}
              alt=""
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, 160px"
            />
          </Link>
        ) : null}

        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <Link
                href={`/properties/${viewing.property.slug}`}
                className="font-medium hover:underline"
              >
                {viewing.property.title}
              </Link>
              <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
                {viewing.property.city}
              </p>
            </div>
            <ViewingStatusBadge status={viewing.status} />
          </div>

          <ViewingMeta
            slots={viewing.slots}
            visitDate={viewing.visitDate}
            status={viewing.status}
            timezone={viewing.timezone}
            mode={viewing.mode}
            partySize={viewing.partySize}
          />

          <p className="text-xs text-muted-foreground">
            {VIEWING_STATUS_HINTS[viewing.status]}
          </p>

          {viewing.statusNote ? (
            <p className="rounded-xl bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Note:</span> {viewing.statusNote}
            </p>
          ) : null}

          <div className="flex flex-wrap items-center gap-3">
            <BuyerViewingActions id={viewing.id} status={viewing.status} />
            <Link
              href={`/dashboard/viewings/${viewing.id}`}
              className="text-xs font-medium text-primary hover:underline"
            >
              Details &amp; activity →
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
