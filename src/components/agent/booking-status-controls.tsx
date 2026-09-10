"use client";

import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateBookingStatusAction } from "@/server/actions/bookings";

export function BookingStatusControls({
  id,
  status,
  visitDate,
}: {
  id: string;
  status: string;
  visitDate: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [date, setDate] = React.useState(visitDate ?? "");

  function update(next: "pending" | "confirmed" | "declined" | "completed") {
    startTransition(async () => {
      const result = await updateBookingStatusAction({
        id,
        status: next,
        visitDate: date || undefined,
      });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Request updated");
      router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <Input
        type="datetime-local"
        value={date}
        onChange={(event) => setDate(event.target.value)}
        className="h-9 w-52"
        aria-label="Visit date and time"
      />
      {status !== "confirmed" ? (
        <Button
          size="sm"
          className="rounded-full"
          disabled={pending}
          onClick={() => update("confirmed")}
        >
          Confirm
        </Button>
      ) : (
        <Button
          size="sm"
          variant="outline"
          className="rounded-full"
          disabled={pending}
          onClick={() => update("completed")}
        >
          Mark complete
        </Button>
      )}
      {status !== "declined" ? (
        <Button
          size="sm"
          variant="ghost"
          className="rounded-full"
          disabled={pending}
          onClick={() => update("declined")}
        >
          Decline
        </Button>
      ) : null}
    </div>
  );
}
