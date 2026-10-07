"use client";

import { CheckCircle2, Loader2 } from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { toast } from "sonner";

import { AvailabilityPicker } from "@/components/viewings/availability-picker";
import { SlotPicker, slotsToIso } from "@/components/viewings/slot-picker";
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
import { Textarea } from "@/components/ui/textarea";
import { CONTACT_KIND_LABELS } from "@/lib/listing-contact";
import { browserTimezone } from "@/lib/viewings";
import { requestViewingAction } from "@/server/actions/bookings";
import type { ListingContactKind } from "@/types";

export function RequestViewingForm({
  propertyId,
  propertySlug,
  contactKind,
  availableSlots,
  takenSlots,
}: {
  propertyId: string;
  propertySlug: string;
  contactKind: ListingContactKind;
  availableSlots: string[];
  takenSlots: string[];
}) {
  const lockedToAvailability = availableSlots.length > 0 || contactKind === "seller";
  const [picked, setPicked] = React.useState("");
  const [slots, setSlots] = React.useState<string[]>([""]);
  const [phone, setPhone] = React.useState("");
  const [mode, setMode] = React.useState("in_person");
  const [partySize, setPartySize] = React.useState("1");
  const [notes, setNotes] = React.useState("");
  const [done, setDone] = React.useState(false);
  const [pending, startTransition] = React.useTransition();
  const timezone = browserTimezone();

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const iso = lockedToAvailability ? (picked ? [picked] : []) : slotsToIso(slots);
    if (iso.length === 0) {
      toast.error(
        lockedToAvailability
          ? "Pick one of the posted viewing times."
          : "Pick at least one time that works for you."
      );
      return;
    }

    startTransition(async () => {
      const result = await requestViewingAction({
        propertyId,
        phone,
        mode: mode as "in_person" | "video",
        partySize: Number(partySize),
        timezone,
        slots: iso,
        notes,
      });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Viewing requested");
      setDone(true);
    });
  }

  if (done) {
    return (
      <div className="flex flex-col items-center py-6 text-center">
        <CheckCircle2 className="h-12 w-12 text-primary" aria-hidden />
        <h2 className="mt-4 text-xl font-semibold">Request sent</h2>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          The {CONTACT_KIND_LABELS[contactKind].toLowerCase()} will review that time. You will be
          notified when they agree, offer another window, or when the platform confirms it.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-2">
          <Button asChild className="rounded-full">
            <Link href="/dashboard/viewings">Track this viewing</Link>
          </Button>
          <Button asChild variant="outline" className="rounded-full">
            <Link href={`/properties/${propertySlug}`}>Back to listing</Link>
          </Button>
        </div>
      </div>
    );
  }

  const noWindows = lockedToAvailability && availableSlots.length === 0;

  return (
    <form className="space-y-6" onSubmit={submit}>
      <fieldset className="space-y-3" disabled={pending}>
        <legend className="text-sm font-semibold">
          {lockedToAvailability ? "Pick a posted time" : "When works for you?"}
        </legend>
        {lockedToAvailability ? (
          <AvailabilityPicker
            slots={availableSlots}
            taken={takenSlots}
            value={picked}
            onChange={setPicked}
            timezone={timezone}
            disabled={pending}
          />
        ) : (
          <SlotPicker value={slots} onChange={setSlots} disabled={pending} />
        )}
      </fieldset>

      {noWindows ? null : (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="mode">Viewing type</Label>
              <Select value={mode} onValueChange={setMode} disabled={pending}>
                <SelectTrigger id="mode">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="in_person">In person</SelectItem>
                  <SelectItem value="video">Video call</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="partySize">People attending</Label>
              <Select value={partySize} onValueChange={setPartySize} disabled={pending}>
                <SelectTrigger id="partySize">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n === 6 ? "6 or more" : n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Contact number</Label>
            <Input
              id="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              required
              minLength={6}
              maxLength={32}
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              disabled={pending}
              placeholder="+92 300 000 0000"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Anything they should know? (optional)</Label>
            <Textarea
              id="notes"
              rows={4}
              maxLength={1000}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              disabled={pending}
            />
          </div>

          <Button type="submit" className="w-full rounded-full" disabled={pending}>
            {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden /> : null}
            Request viewing
          </Button>
        </>
      )}
    </form>
  );
}
