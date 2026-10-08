"use client";

import { Plus, X } from "lucide-react";

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
  DEFAULT_BUFFER_MIN,
  DEFAULT_DURATION_MIN,
  MAX_WINDOWS,
  VIEW_BUFFERS,
  VIEW_DURATIONS,
  formatClockRange,
  generateSlots,
} from "@/lib/viewings";
import { browserTimezone } from "@/lib/viewings";

export type WindowValue = {
  start: string;
  end: string;
  durationMin: number;
  bufferMin: number;
};

export const emptyWindow = (): WindowValue => ({
  start: "",
  end: "",
  durationMin: DEFAULT_DURATION_MIN,
  bufferMin: DEFAULT_BUFFER_MIN,
});

function splitLocal(value: string) {
  if (!value || !value.includes("T")) return { date: "", time: "" };
  const [date, time] = value.split("T");
  return { date, time: (time ?? "").slice(0, 5) };
}

function joinLocal(date: string, time: string) {
  if (!date || !time) return "";
  return `${date}T${time}`;
}

export function AvailabilityWindowsField({
  value,
  onChange,
  disabled,
  required,
}: {
  value: WindowValue[];
  onChange: (next: WindowValue[]) => void;
  disabled?: boolean;
  required?: boolean;
}) {
  const rows = value.length ? value : [emptyWindow()];
  const timezone = browserTimezone();

  function patch(index: number, next: Partial<WindowValue>) {
    onChange(rows.map((row, i) => (i === index ? { ...row, ...next } : row)));
  }

  return (
    <div className="space-y-4">
      {rows.map((row, index) => {
        const date = splitLocal(row.start).date || splitLocal(row.end).date;
        const startTime = splitLocal(row.start).time;
        const endTime = splitLocal(row.end).time;
        const start = row.start ? new Date(row.start) : null;
        const end = row.end ? new Date(row.end) : null;
        const preview =
          start && end && !Number.isNaN(start.valueOf()) && !Number.isNaN(end.valueOf())
            ? generateSlots({
                start,
                end,
                durationMin: row.durationMin,
                bufferMin: row.bufferMin,
              })
            : [];

        return (
          <div key={index} className="space-y-3 rounded-2xl border border-border p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Window {index + 1}</p>
              {index > 0 || !required ? (
                <button
                  type="button"
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                  disabled={disabled}
                  onClick={() => onChange(rows.filter((_, i) => i !== index))}
                >
                  <X className="h-3 w-3" aria-hidden />
                  Remove
                </button>
              ) : null}
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Date</Label>
                <Input
                  type="date"
                  value={date}
                  disabled={disabled}
                  className="rounded-2xl"
                  onChange={(event) => {
                    const nextDate = event.target.value;
                    patch(index, {
                      start: joinLocal(nextDate, startTime || "10:00"),
                      end: joinLocal(nextDate, endTime || "13:00"),
                    });
                  }}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Start</Label>
                <Input
                  type="time"
                  step={900}
                  value={startTime}
                  disabled={disabled}
                  className="rounded-2xl"
                  onChange={(event) =>
                    patch(index, { start: joinLocal(date, event.target.value) })
                  }
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">End</Label>
                <Input
                  type="time"
                  step={900}
                  value={endTime}
                  disabled={disabled}
                  className="rounded-2xl"
                  onChange={(event) =>
                    patch(index, { end: joinLocal(date, event.target.value) })
                  }
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Viewing length</Label>
                <Select
                  value={String(row.durationMin)}
                  disabled={disabled}
                  onValueChange={(value) => patch(index, { durationMin: Number(value) })}
                >
                  <SelectTrigger className="rounded-2xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {VIEW_DURATIONS.map((minutes) => (
                      <SelectItem key={minutes} value={String(minutes)}>
                        {minutes} minutes{minutes === 30 ? " (recommended)" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Buffer between viewings</Label>
                <Select
                  value={String(row.bufferMin)}
                  disabled={disabled}
                  onValueChange={(value) => patch(index, { bufferMin: Number(value) })}
                >
                  <SelectTrigger className="rounded-2xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {VIEW_BUFFERS.map((minutes) => (
                      <SelectItem key={minutes} value={String(minutes)}>
                        {minutes === 0 ? "No buffer" : `${minutes} minutes`}
                        {minutes === 15 ? " (recommended)" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="rounded-2xl bg-muted/40 px-3 py-2 text-sm">
              <p className="text-xs font-medium text-muted-foreground">Generated slots</p>
              {preview.length === 0 ? (
                <p className="mt-1 text-muted-foreground">
                  Pick a date and a range long enough for one {row.durationMin}-minute viewing.
                </p>
              ) : (
                <ul className="mt-1 flex flex-wrap gap-2">
                  {preview.map((slot) => (
                    <li
                      key={slot.toISOString()}
                      className="rounded-full border border-border bg-background px-2.5 py-1 text-xs tabular-nums"
                    >
                      {formatClockRange(slot, row.durationMin, timezone)}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        );
      })}

      {rows.length < MAX_WINDOWS ? (
        <Button
          type="button"
          variant="outline"
          className="rounded-full"
          disabled={disabled}
          onClick={() => onChange([...rows, emptyWindow()])}
        >
          <Plus className="mr-2 h-4 w-4" aria-hidden />
          Add another window
        </Button>
      ) : null}
    </div>
  );
}
