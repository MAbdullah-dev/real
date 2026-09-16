import { CalendarRange, Mail, Phone } from "lucide-react";
import Link from "next/link";

import {
  ViewingMeta,
  ViewingStatusBadge,
  ViewingTimeline,
} from "@/components/viewings/viewing-meta";
import { HostViewingControls } from "@/components/viewings/host-viewing-controls";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Separator } from "@/components/ui/separator";
import { telHref } from "@/lib/listing-contact";
import { isViewingOpen } from "@/lib/viewings";
import { requireAuth } from "@/server/auth";
import { listHostViewings } from "@/server/bookings";

/** One inbox shared by the seller, broker, and agency consoles. */
export async function ViewingInbox({ emptyHref }: { emptyHref?: string }) {
  const session = await requireAuth();
  const viewings = await listHostViewings(session.user.id, session.user.role);

  if (viewings.length === 0) {
    return (
      <EmptyState
        icon={CalendarRange}
        title="No viewing requests yet"
        description="When a buyer asks to view one of your published listings, it lands here with their contact details and preferred times."
        {...(emptyHref ? { action: { label: "Review listings", href: emptyHref } } : {})}
      />
    );
  }

  const open = viewings.filter((viewing) => isViewingOpen(viewing.status));
  const closed = viewings.filter((viewing) => !isViewingOpen(viewing.status));

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <h2 className="text-sm font-semibold">
          Needs you{" "}
          <span className="font-normal text-muted-foreground">({open.length})</span>
        </h2>
        {open.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border bg-muted/20 px-4 py-6 text-sm text-muted-foreground">
            Nothing outstanding — every request has been answered.
          </p>
        ) : (
          open.map((viewing) => <HostViewingCard key={viewing.id} viewing={viewing} />)
        )}
      </section>

      {closed.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold">
            History <span className="font-normal text-muted-foreground">({closed.length})</span>
          </h2>
          {closed.map((viewing) => (
            <HostViewingCard key={viewing.id} viewing={viewing} />
          ))}
        </section>
      ) : null}
    </div>
  );
}

type Viewing = Awaited<ReturnType<typeof listHostViewings>>[number];

function HostViewingCard({ viewing }: { viewing: Viewing }) {
  return (
    <Card className="rounded-3xl">
      <CardContent className="space-y-4 p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <Link
              href={`/properties/${viewing.property.slug}`}
              className="font-medium hover:underline"
            >
              {viewing.property.title}
            </Link>
            <p className="mt-1 text-sm text-muted-foreground">{viewing.property.city}</p>
          </div>
          <ViewingStatusBadge status={viewing.status} />
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          <span className="font-medium">{viewing.name}</span>
          <a
            href={`mailto:${viewing.email}`}
            className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
          >
            <Mail className="h-3.5 w-3.5" aria-hidden />
            {viewing.email}
          </a>
          <a
            href={telHref(viewing.phone)}
            className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
          >
            <Phone className="h-3.5 w-3.5" aria-hidden />
            {viewing.phone}
          </a>
        </div>

        <ViewingMeta
          slots={viewing.slots}
          visitDate={viewing.visitDate}
          status={viewing.status}
          timezone={viewing.timezone}
          mode={viewing.mode}
          partySize={viewing.partySize}
        />

        {viewing.notes ? (
          <p className="rounded-xl bg-muted/40 p-3 text-sm text-muted-foreground">
            {viewing.notes}
          </p>
        ) : null}

        {isViewingOpen(viewing.status) ? (
          <>
            <Separator />
            <HostViewingControls
              id={viewing.id}
              status={viewing.status}
              slots={viewing.slots.map((slot) => slot.toISOString())}
              visitDate={viewing.visitDate?.toISOString() ?? null}
            />
          </>
        ) : null}

        {viewing.events.length > 1 ? (
          <details className="text-sm">
            <summary className="cursor-pointer text-xs font-medium text-muted-foreground hover:text-foreground">
              Activity ({viewing.events.length})
            </summary>
            <div className="mt-3">
              <ViewingTimeline
                events={viewing.events}
                timezone={viewing.timezone}
                viewer="host"
              />
            </div>
          </details>
        ) : null}
      </CardContent>
    </Card>
  );
}
