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
import { adminUpdateViewingAction } from "@/server/actions/bookings";

function toLocalInput(date: Date | string | null) {
  if (!date) return "";
  const value = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(value.valueOf())) return "";
  return new Date(value.getTime() - value.getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 16);
}

export function AdminViewingControls({
  id,
  status,
  visitDate,
  assignedBrokerId,
  brokers,
  city,
  fallback,
}: {
  id: string;
  status: BookingStatus;
  visitDate: string | null;
  assignedBrokerId: string | null;
  city: string;
  fallback: boolean;
  brokers: Array<{ userId: string; user: { name: string | null; email: string | null }; city: string | null }>;
}) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [when, setWhen] = React.useState(() => toLocalInput(visitDate));
  const [note, setNote] = React.useState("");
  const [brokerUserId, setBrokerUserId] = React.useState(assignedBrokerId ?? "");

  function run(
    intent: "accept" | "reschedule" | "decline" | "assign" | "skip_broker",
    extra?: { visitDate?: string; brokerUserId?: string }
  ) {
    startTransition(async () => {
      const result = await adminUpdateViewingAction({
        id,
        intent,
        visitDate: extra?.visitDate,
        note: note || undefined,
        brokerUserId: extra?.brokerUserId,
      });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Updated");
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      {status === "pending_admin" || status === "proposed" ? (
        <div className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor={`admin-when-${id}`} className="text-xs text-muted-foreground">
              Viewing time
            </Label>
            <Input
              id={`admin-when-${id}`}
              type="datetime-local"
              value={when}
              step={900}
              className="h-9 w-56"
              disabled={pending}
              onChange={(event) => setWhen(event.target.value)}
            />
          </div>
          <Textarea
            rows={2}
            maxLength={500}
            value={note}
            disabled={pending}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Optional note to buyer and seller"
          />
          <div className="flex flex-wrap gap-2">
            {status === "pending_admin" ? (
              <Button
                size="sm"
                className="rounded-full"
                disabled={pending}
                onClick={() => run("accept")}
              >
                {pending ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" aria-hidden /> : null}
                Accept this time
              </Button>
            ) : null}
            <Button
              size="sm"
              variant="outline"
              className="rounded-full"
              disabled={pending || !when}
              onClick={() => run("reschedule", { visitDate: new Date(when).toISOString() })}
            >
              Send new time to both
            </Button>
            {status === "pending_admin" ? (
              <Button
                size="sm"
                variant="ghost"
                className="rounded-full text-muted-foreground"
                disabled={pending}
                onClick={() => run("decline")}
              >
                Decline
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}

      {status === "confirmed" ? (
        <div className="space-y-3">
          <p className="text-sm font-medium">
            Brokers in {city || "this city"}
            {fallback ? " (no exact city match — showing all active brokers)" : ""}
          </p>
          {brokers.length === 0 ? (
            <p className="text-sm text-muted-foreground">No active brokers to assign.</p>
          ) : (
            <div className="grid gap-2">
              {brokers.map((broker) => (
                <label
                  key={broker.userId}
                  className="flex items-center gap-3 rounded-2xl border border-border px-4 py-3 text-sm"
                >
                  <input
                    type="radio"
                    name={`broker-${id}`}
                    className="accent-primary"
                    checked={brokerUserId === broker.userId}
                    onChange={() => setBrokerUserId(broker.userId)}
                    disabled={pending}
                  />
                  <span>
                    <span className="font-medium">{broker.user.name ?? "Broker"}</span>
                    <span className="block text-xs text-muted-foreground">
                      {broker.city ?? "No city"} · {broker.user.email}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              className="rounded-full"
              disabled={pending || !brokerUserId}
              onClick={() => run("assign", { brokerUserId })}
            >
              Assign broker
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="rounded-full"
              disabled={pending}
              onClick={() => run("skip_broker")}
            >
              Continue without a broker
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
