import type { BookingStatus, VisitMode } from "@prisma/client";
import { CalendarCheck, Clock, Users, Video } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  VIEWING_STATUS_LABELS,
  VIEWING_STATUS_TONE,
  VISIT_MODE_LABELS,
  formatInZone,
} from "@/lib/viewings";

export function ViewingStatusBadge({ status }: { status: BookingStatus }) {
  return (
    <Badge variant={VIEWING_STATUS_TONE[status]}>{VIEWING_STATUS_LABELS[status]}</Badge>
  );
}

export function ViewingMeta({
  slots,
  visitDate,
  status,
  timezone,
  mode,
  partySize,
}: {
  slots: Date[];
  visitDate: Date | null;
  status: BookingStatus;
  timezone: string;
  mode: VisitMode;
  partySize: number;
}) {
  const showAgreed = visitDate && (status === "confirmed" || status === "proposed" || status === "completed");

  return (
    <div className="space-y-3 text-sm">
      {showAgreed ? (
        <p className="flex flex-wrap items-center gap-2 font-medium">
          <CalendarCheck className="h-4 w-4 shrink-0 text-primary" aria-hidden />
          {status === "proposed" ? "Offered time:" : "Scheduled:"}{" "}
          <span className="tabular-nums">{formatInZone(visitDate, timezone)}</span>
        </p>
      ) : null}

      {slots.length > 0 && status !== "completed" ? (
        <p className="flex flex-wrap items-start gap-2 text-muted-foreground">
          <Clock className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <span>
            <span className="font-medium text-foreground">Buyer prefers:</span>{" "}
            {slots.map((slot) => formatInZone(slot, timezone)).join(" · ")}
          </span>
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          {mode === "video" ? (
            <Video className="h-3.5 w-3.5" aria-hidden />
          ) : (
            <CalendarCheck className="h-3.5 w-3.5" aria-hidden />
          )}
          {VISIT_MODE_LABELS[mode]}
        </span>
        <span className="inline-flex items-center gap-1">
          <Users className="h-3.5 w-3.5" aria-hidden />
          {partySize} {partySize === 1 ? "person" : "people"}
        </span>
        <span>Times shown in {timezone}</span>
      </div>
    </div>
  );
}

export function ViewingTimeline({
  events,
  timezone,
  viewer,
}: {
  events: { id: string; status: BookingStatus; actorRole: string; note: string | null; createdAt: Date }[];
  timezone: string;
  viewer: "buyer" | "host";
}) {
  if (events.length === 0) return null;

  const who: Record<string, string> = {
    buyer: viewer === "buyer" ? "You" : "Buyer",
    host: viewer === "host" ? "You" : "Listing contact",
    admin: "Support",
    system: "System",
  };

  return (
    <ol className="space-y-3">
      {events.map((event) => (
        <li key={event.id} className="flex gap-3 text-sm">
          <span
            className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary/60"
            aria-hidden
          />
          <div>
            <p className="font-medium">{VIEWING_STATUS_LABELS[event.status]}</p>
            <p className="text-xs text-muted-foreground">
              {who[event.actorRole] ?? event.actorRole} ·{" "}
              {formatInZone(event.createdAt, timezone)}
            </p>
            {event.note ? (
              <p className="mt-1 rounded-xl bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
                {event.note}
              </p>
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  );
}
