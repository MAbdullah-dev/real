"use client";

import type { BookingStatus } from "@prisma/client";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { hostUpdateViewingAction } from "@/server/actions/bookings";

function toLocalInput(date: Date | string | null) {
  if (!date) return "";
  const value = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(value.valueOf())) return "";
  return new Date(value.getTime() - value.getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 16);
}

type HostAction =
  | "confirmed"
  | "proposed"
  | "declined"
  | "completed"
  | "no_show"
  | "cancelled";

/**
 * The host picks a time — normally one of the buyer's slots — then confirms it,
 * or offers a different one which the buyer has to accept.
 */
export function HostViewingControls({
  id,
  status,
  slots,
  visitDate,
}: {
  id: string;
  status: BookingStatus;
  /** Buyer-preferred times as ISO strings. */
  slots: string[];
  visitDate: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [when, setWhen] = React.useState(
    () => toLocalInput(visitDate) || toLocalInput(slots[0] ?? null)
  );
  const [note, setNote] = React.useState("");
  const [noteOpen, setNoteOpen] = React.useState(false);

  function run(next: HostAction, options?: { withTime?: boolean }) {
    startTransition(async () => {
      const result = await hostUpdateViewingAction({
        id,
        status: next,
        visitDate: options?.withTime && when ? new Date(when).toISOString() : undefined,
        note: note || undefined,
      });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Viewing updated");
      setNote("");
      setNoteOpen(false);
      router.refresh();
    });
  }

  const canSchedule = status === "pending" || status === "proposed" || status === "confirmed";
  const pastDue = Boolean(visitDate && new Date(visitDate) <= new Date());

  return (
    <div className="space-y-3">
      {canSchedule ? (
        <div className="flex flex-wrap items-end gap-2">
          <div className="space-y-1">
            <Label htmlFor={`when-${id}`} className="text-xs text-muted-foreground">
              Date and time
            </Label>
            <Input
              id={`when-${id}`}
              type="datetime-local"
              value={when}
              step={900}
              className="h-9 w-56"
              disabled={pending}
              onChange={(event) => setWhen(event.target.value)}
            />
          </div>
          {slots.length > 0 ? (
            <div className="flex flex-wrap gap-1.5 pb-1">
              {slots.map((slot) => (
                <button
                  key={slot}
                  type="button"
                  className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
                  disabled={pending}
                  onClick={() => setWhen(toLocalInput(slot))}
                >
                  Use{" "}
                  {new Date(slot).toLocaleString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      {noteOpen ? (
        <div className="space-y-1">
          <Label htmlFor={`note-${id}`} className="text-xs text-muted-foreground">
            Message to the buyer (optional)
          </Label>
          <Textarea
            id={`note-${id}`}
            rows={2}
            maxLength={500}
            value={note}
            disabled={pending}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Gate code, who to ask for at reception, why the time changed…"
          />
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        {status === "pending" || status === "proposed" ? (
          <Button
            size="sm"
            className="rounded-full"
            disabled={pending || !when}
            onClick={() => run("confirmed", { withTime: true })}
          >
            {pending ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" aria-hidden /> : null}
            Confirm
          </Button>
        ) : null}

        {canSchedule ? (
          <Button
            size="sm"
            variant="outline"
            className="rounded-full"
            disabled={pending || !when}
            onClick={() => run("proposed", { withTime: true })}
          >
            Offer this time instead
          </Button>
        ) : null}

        {status === "confirmed" && pastDue ? (
          <>
            <Button
              size="sm"
              variant="outline"
              className="rounded-full"
              disabled={pending}
              onClick={() => run("completed")}
            >
              Mark complete
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="rounded-full text-muted-foreground"
              disabled={pending}
              onClick={() => run("no_show")}
            >
              Buyer no-show
            </Button>
          </>
        ) : null}

        {status === "pending" || status === "proposed" ? (
          <Button
            size="sm"
            variant="ghost"
            className="rounded-full text-muted-foreground"
            disabled={pending}
            onClick={() => run("declined")}
          >
            Decline
          </Button>
        ) : null}

        {status === "confirmed" && !pastDue ? (
          <Button
            size="sm"
            variant="ghost"
            className="rounded-full text-muted-foreground"
            disabled={pending}
            onClick={() => run("cancelled")}
          >
            Cancel
          </Button>
        ) : null}

        {canSchedule && !noteOpen ? (
          <button
            type="button"
            className="text-xs text-muted-foreground underline-offset-2 hover:underline"
            onClick={() => setNoteOpen(true)}
          >
            Add a note
          </button>
        ) : null}
      </div>
    </div>
  );
}
