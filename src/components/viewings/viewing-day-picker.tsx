"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date: Date, count: number) {
  return new Date(date.getFullYear(), date.getMonth() + count, 1);
}

function ymd(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function ViewingDayPicker({
  availableDays,
  value,
  onChange,
  min,
  max,
}: {
  availableDays: Set<string>;
  value: string;
  onChange: (next: string) => void;
  min?: string;
  max?: string;
}) {
  const [cursor, setCursor] = React.useState(() => startOfMonth(value ? new Date(`${value}T12:00`) : new Date()));
  const first = startOfMonth(cursor);
  const startWeekday = first.getDay();
  const daysInMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
  const cells: Array<{ key: string; label: string; date?: string }> = [];
  for (let i = 0; i < startWeekday; i += 1) cells.push({ key: `e-${i}`, label: "" });
  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = ymd(new Date(cursor.getFullYear(), cursor.getMonth(), day));
    cells.push({ key: date, label: String(day), date });
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="rounded-full"
          onClick={() => setCursor((current) => addMonths(current, -1))}
          aria-label="Previous month"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <p className="text-sm font-medium">
          {cursor.toLocaleString("en-US", { month: "long", year: "numeric" })}
        </p>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="rounded-full"
          onClick={() => setCursor((current) => addMonths(current, 1))}
          aria-label="Next month"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground">
        {WEEKDAYS.map((day) => (
          <div key={day} className="py-1">
            {day}
          </div>
        ))}
        {cells.map((cell) => {
          const enabled =
            Boolean(cell.date) &&
            availableDays.has(cell.date!) &&
            (!min || cell.date! >= min) &&
            (!max || cell.date! <= max);
          return (
            <button
              key={cell.key}
              type="button"
              disabled={!enabled}
              onClick={() => cell.date && onChange(cell.date)}
              className={cn(
                "flex h-10 items-center justify-center rounded-xl text-sm tabular-nums",
                !cell.date && "pointer-events-none",
                enabled && "hover:bg-muted",
                !enabled && cell.date && "text-muted-foreground/40",
                cell.date === value && "bg-primary text-primary-foreground hover:bg-primary"
              )}
            >
              {cell.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
