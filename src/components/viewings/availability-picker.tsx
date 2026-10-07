"use client";

import { formatInZone, sameSlot } from "@/lib/viewings";

export function AvailabilityPicker({
  slots,
  taken,
  value,
  onChange,
  timezone,
  disabled,
}: {
  slots: string[];
  taken: string[];
  value: string;
  onChange: (next: string) => void;
  timezone: string;
  disabled?: boolean;
}) {
  if (slots.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-border bg-muted/20 px-4 py-6 text-sm text-muted-foreground">
        The owner has not posted any viewing times yet. Check back after they add availability.
      </p>
    );
  }

  return (
    <div className="grid gap-2">
      {slots.map((slot) => {
        const busy = taken.some((item) => sameSlot(item, slot));
        const id = `avail-${slot}`;
        return (
          <label
            key={slot}
            htmlFor={id}
            className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm ${
              busy
                ? "cursor-not-allowed border-border/60 bg-muted/30 text-muted-foreground"
                : "cursor-pointer border-border hover:border-primary/40"
            }`}
          >
            <input
              id={id}
              type="radio"
              name="available-slot"
              className="accent-primary"
              value={slot}
              checked={value === slot}
              disabled={disabled || busy}
              onChange={() => onChange(slot)}
            />
            <span className="font-medium tabular-nums">{formatInZone(slot, timezone)}</span>
            {busy ? <span className="ml-auto text-xs">Taken</span> : null}
          </label>
        );
      })}
    </div>
  );
}
