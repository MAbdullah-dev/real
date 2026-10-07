"use client";

import type { BookingStatus } from "@prisma/client";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  adminAcceptViewingAction,
  adminAssignBrokerAction,
  adminProposeViewingAction,
} from "@/server/actions/bookings";

function toLocalInput(date: Date | string | null) {
  if (!date) return "";
  const value = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(value.valueOf())) return "";
  return new Date(value.getTime() - value.getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 16);
}

export type AdminBrokerOption = {
  userId: string;
  name: string;
  city: string | null;
};

export function AdminViewingControls({
  id,
  status,
  visitDate,
  assignedBrokerId,
  city,
  brokersInCity,
  allBrokers,
}: {
  id: string;
  status: BookingStatus;
  visitDate: string | null;
  assignedBrokerId: string | null;
  city: string;
  brokersInCity: AdminBrokerOption[];
  allBrokers: AdminBrokerOption[];
}) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [when, setWhen] = React.useState(() => toLocalInput(visitDate));
  const [brokerId, setBrokerId] = React.useState(assignedBrokerId ?? "none");
  const roster = brokersInCity.length > 0 ? brokersInCity : allBrokers;

  function refresh() {
    router.refresh();
  }

  return (
    <div className="space-y-3">
      {status === "awaiting_admin" || status === "admin_proposed" || status === "confirmed" ? (
        <div className="flex flex-wrap items-end gap-2">
          <div className="space-y-1">
            <Label htmlFor={`admin-when-${id}`} className="text-xs text-muted-foreground">
              Date and time
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
          {status === "awaiting_admin" || status === "admin_proposed" ? (
            <Button
              size="sm"
              className="rounded-full"
              disabled={pending || !when}
              onClick={() =>
                startTransition(async () => {
                  const result = await adminAcceptViewingAction({
                    id,
                    visitDate: new Date(when).toISOString(),
                  });
                  if (result.error) {
                    toast.error(result.error);
                    return;
                  }
                  toast.success("Confirmed — buyer and seller notified");
                  refresh();
                })
              }
            >
              {pending ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" aria-hidden /> : null}
              Accept time
            </Button>
          ) : null}
          <Button
            size="sm"
            variant="outline"
            className="rounded-full"
            disabled={pending || !when}
            onClick={() =>
              startTransition(async () => {
                const result = await adminProposeViewingAction({
                  id,
                  visitDate: new Date(when).toISOString(),
                });
                if (result.error) {
                  toast.error(result.error);
                  return;
                }
                toast.success("New time sent to buyer and seller");
                refresh();
              })
            }
          >
            Reschedule
          </Button>
        </div>
      ) : null}

      {status === "confirmed" ? (
        <div className="flex flex-wrap items-end gap-2">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">
              {brokersInCity.length > 0
                ? `Brokers in ${city}`
                : `No brokers in ${city} — all active brokers`}
            </Label>
            <Select value={brokerId} onValueChange={setBrokerId} disabled={pending}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="No broker" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Continue without a broker</SelectItem>
                {roster.map((broker) => (
                  <SelectItem key={broker.userId} value={broker.userId}>
                    {broker.name}
                    {broker.city ? ` · ${broker.city}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            size="sm"
            className="rounded-full"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                const result = await adminAssignBrokerAction({
                  id,
                  brokerUserId: brokerId === "none" ? undefined : brokerId,
                });
                if (result.error) {
                  toast.error(result.error);
                  return;
                }
                toast.success(
                  brokerId === "none" ? "No broker assigned" : "Broker assigned"
                );
                refresh();
              })
            }
          >
            Save assignment
          </Button>
        </div>
      ) : null}
    </div>
  );
}
