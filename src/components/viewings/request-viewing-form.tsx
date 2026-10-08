"use client";

import { CheckCircle2, Loader2 } from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { toast } from "sonner";

import { ViewingDayPicker } from "@/components/viewings/viewing-day-picker";
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
import { browserTimezone, dayKey, formatClockRange, formatSlotRange } from "@/lib/viewings";
import { requestViewingAction } from "@/server/actions/bookings";
import type { ListingContactKind } from "@/types";

export type OpenSlot = { start: string; end: string; durationMin: number };

export function RequestViewingForm({
  propertyId,
  propertySlug,
  propertyTitle,
  contactKind,
  openSlots,
}: {
  propertyId: string;
  propertySlug: string;
  propertyTitle: string;
  contactKind: ListingContactKind;
  openSlots: OpenSlot[];
}) {
  const lockedToAvailability = openSlots.length > 0 || contactKind === "seller";
  const [day, setDay] = React.useState("");
  const [picked, setPicked] = React.useState("");
  const [slots, setSlots] = React.useState<string[]>([""]);
  const [phone, setPhone] = React.useState("");
  const [mode, setMode] = React.useState("in_person");
  const [partySize, setPartySize] = React.useState("1");
  const [notes, setNotes] = React.useState("");
  const [done, setDone] = React.useState(false);
  const [pending, startTransition] = React.useTransition();
  const timezone = browserTimezone();

  const days = React.useMemo(() => {
    const set = new Set<string>();
    for (const slot of openSlots) set.add(dayKey(slot.start, timezone));
    return set;
  }, [openSlots, timezone]);

  const slotsForDay = openSlots.filter((slot) => dayKey(slot.start, timezone) === day);
  const selected = openSlots.find((slot) => slot.start === picked);

  React.useEffect(() => {
    if (day && !days.has(day)) setDay("");
    if (picked && !openSlots.some((slot) => slot.start === picked)) setPicked("");
  }, [day, days, openSlots, picked]);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const iso = lockedToAvailability ? (picked ? [picked] : []) : slotsToIso(slots);
    if (iso.length === 0) {
      toast.error(
        lockedToAvailability
          ? "Pick a date and an available time."
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

  const noWindows = lockedToAvailability && openSlots.length === 0;

  return (
    <form className="space-y-6" onSubmit={submit}>
      <fieldset className="space-y-4" disabled={pending}>
        <legend className="text-sm font-semibold">
          {lockedToAvailability ? "Choose a viewing time" : "When works for you?"}
        </legend>
        {noWindows ? (
          <p className="rounded-2xl border border-dashed border-border bg-muted/20 px-4 py-6 text-sm text-muted-foreground">
            The owner has not posted any viewing times yet. Check back after they add availability.
          </p>
        ) : lockedToAvailability ? (
          <div className="space-y-4">
            <ViewingDayPicker availableDays={days} value={day} onChange={setDay} />
            {day ? (
              <div className="space-y-2">
                <p className="text-sm font-medium">Available times</p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {slotsForDay.map((slot) => (
                    <button
                      key={slot.start}
                      type="button"
                      onClick={() => setPicked(slot.start)}
                      className={`min-h-11 rounded-2xl border px-3 py-2 text-sm tabular-nums ${
                        picked === slot.start
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border hover:border-primary/40"
                      }`}
                    >
                      {formatClockRange(slot.start, slot.durationMin, timezone)}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Select a highlighted date to see times.</p>
            )}
            {selected ? (
              <div className="rounded-2xl bg-muted/40 px-4 py-3 text-sm">
                <p className="font-medium">{propertyTitle}</p>
                <p className="mt-1 tabular-nums text-muted-foreground">
                  {formatSlotRange(selected.start, selected.durationMin, timezone)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">{selected.durationMin}-minute viewing</p>
              </div>
            ) : null}
          </div>
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
