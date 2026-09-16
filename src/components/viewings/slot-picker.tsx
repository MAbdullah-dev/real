"use client";

import { Plus, X } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { MAX_DAYS_AHEAD, MAX_SLOTS, MIN_LEAD_HOURS } from "@/lib/viewings";

const ORDINALS = ["First choice", "Second choice", "Third choice"];

function toLocalInput(date: Date) {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 16);
}

/**
 * Collects up to three preferred start times as `datetime-local` values.
 * The parent keeps the raw strings and converts to ISO on submit.
 */
export function SlotPicker({
  value,
  onChange,
  disabled,
}: {
  value: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
}) {
  // The clock can't be read during render, and a server-rendered bound would
  // disagree with the browser's zone anyway, so nudge the native picker from a
  // ref callback. The server action is still the real gate on these values.
  const applyBounds = React.useCallback((node: HTMLInputElement | null) => {
    if (!node) return;
    const now = Date.now();
    node.min = toLocalInput(new Date(now + MIN_LEAD_HOURS * 3_600_000));
    node.max = toLocalInput(new Date(now + MAX_DAYS_AHEAD * 24 * 3_600_000));
  }, []);

  function setAt(index: number, next: string) {
    onChange(value.map((slot, i) => (i === index ? next : slot)));
  }

  return (
    <div className="space-y-3">
      {value.map((slot, index) => (
        <div key={index} className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor={`slot-${index}`} className="text-xs text-muted-foreground">
              {ORDINALS[index] ?? `Option ${index + 1}`}
              {index === 0 ? " (required)" : ""}
            </Label>
            {index > 0 ? (
              <button
                type="button"
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                onClick={() => onChange(value.filter((_, i) => i !== index))}
                disabled={disabled}
              >
                <X className="h-3 w-3" aria-hidden />
                Remove
              </button>
            ) : null}
          </div>
          <Input
            id={`slot-${index}`}
            ref={applyBounds}
            type="datetime-local"
            value={slot}
            step={900}
            disabled={disabled}
            onChange={(event) => setAt(index, event.target.value)}
          />
        </div>
      ))}

      {value.length < MAX_SLOTS ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-full"
          disabled={disabled}
          onClick={() => onChange([...value, ""])}
        >
          <Plus className="mr-1 h-3.5 w-3.5" aria-hidden />
          Add another time
        </Button>
      ) : null}

      <p className="text-xs text-muted-foreground">
        Offering more than one window gets you confirmed faster. Times are in your local
        zone, at least {MIN_LEAD_HOURS} hours from now.
      </p>
    </div>
  );
}

/** Drops blanks and converts the picker's local values into UTC ISO strings. */
export function slotsToIso(value: string[]) {
  return value
    .map((slot) => new Date(slot.trim()))
    .filter((date) => !Number.isNaN(date.valueOf()))
    .map((date) => date.toISOString());
}
