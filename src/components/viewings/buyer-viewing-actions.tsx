"use client";

import type { BookingStatus } from "@prisma/client";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

import { SlotPicker, slotsToIso } from "@/components/viewings/slot-picker";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { isViewingOpen } from "@/lib/viewings";
import { buyerUpdateViewingAction } from "@/server/actions/bookings";

export function BuyerViewingActions({
  id,
  status,
}: {
  id: string;
  status: BookingStatus;
}) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [rescheduleOpen, setRescheduleOpen] = React.useState(false);
  const [cancelOpen, setCancelOpen] = React.useState(false);
  const [slots, setSlots] = React.useState<string[]>([""]);
  const [reason, setReason] = React.useState("");

  function run(
    input: Parameters<typeof buyerUpdateViewingAction>[0],
    success: string,
    onDone?: () => void
  ) {
    startTransition(async () => {
      const result = await buyerUpdateViewingAction(input);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(success);
      onDone?.();
      router.refresh();
    });
  }

  const open = isViewingOpen(status);

  return (
    <div className="flex flex-wrap items-center gap-2">
      {status === "proposed" ? (
        <Button
          size="sm"
          className="rounded-full"
          disabled={pending}
          onClick={() => run({ id, intent: "accept" }, "Viewing confirmed")}
        >
          {pending ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" aria-hidden /> : null}
          Accept this time
        </Button>
      ) : null}

      {status !== "completed" ? (
        <Dialog open={rescheduleOpen} onOpenChange={setRescheduleOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" className="rounded-full" disabled={pending}>
              {status === "declined" || status === "cancelled" || status === "no_show"
                ? "Propose new times"
                : "Reschedule"}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Propose new times</DialogTitle>
              <DialogDescription>
                This replaces your previous preferences and puts the request back with the
                listing contact.
              </DialogDescription>
            </DialogHeader>
            <SlotPicker value={slots} onChange={setSlots} disabled={pending} />
            <Button
              className="w-full rounded-full"
              disabled={pending}
              onClick={() => {
                const iso = slotsToIso(slots);
                if (iso.length === 0) {
                  toast.error("Pick at least one time.");
                  return;
                }
                run({ id, intent: "reschedule", slots: iso }, "New times sent", () =>
                  setRescheduleOpen(false)
                );
              }}
            >
              {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden /> : null}
              Send new times
            </Button>
          </DialogContent>
        </Dialog>
      ) : null}

      {open ? (
        <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
          <DialogTrigger asChild>
            <Button
              size="sm"
              variant="ghost"
              className="rounded-full text-muted-foreground"
              disabled={pending}
            >
              Cancel
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cancel this viewing?</DialogTitle>
              <DialogDescription>
                The listing contact is notified. You can request a new viewing later.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <Label htmlFor={`cancel-reason-${id}`}>Reason (optional)</Label>
              <Textarea
                id={`cancel-reason-${id}`}
                rows={3}
                maxLength={500}
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                disabled={pending}
                placeholder="Plans changed, found something else…"
              />
            </div>
            <div className="flex flex-wrap justify-end gap-2">
              <Button
                variant="outline"
                className="rounded-full"
                disabled={pending}
                onClick={() => setCancelOpen(false)}
              >
                Keep it
              </Button>
              <Button
                variant="destructive"
                className="rounded-full"
                disabled={pending}
                onClick={() =>
                  run({ id, intent: "cancel", reason }, "Viewing cancelled", () =>
                    setCancelOpen(false)
                  )
                }
              >
                {pending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                ) : null}
                Cancel viewing
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      ) : null}
    </div>
  );
}
