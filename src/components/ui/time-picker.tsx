"use client";

import { Clock } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const HOURS_12 = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] as const;
const MINUTES = [0, 15, 30, 45] as const;

type Period = "AM" | "PM";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function parseHm(value: string): { hour12: number; minute: number; period: Period } | null {
  if (!/^\d{2}:\d{2}$/.test(value)) return null;
  const [hRaw, mRaw] = value.split(":").map(Number);
  if (!Number.isFinite(hRaw) || !Number.isFinite(mRaw)) return null;
  const period: Period = hRaw >= 12 ? "PM" : "AM";
  const hour12 = hRaw % 12 === 0 ? 12 : hRaw % 12;
  const minute = MINUTES.includes(mRaw as (typeof MINUTES)[number])
    ? mRaw
    : MINUTES.reduce((best, option) =>
        Math.abs(option - mRaw) < Math.abs(best - mRaw) ? option : best
      );
  return { hour12, minute, period };
}

function toHm(hour12: number, minute: number, period: Period) {
  let hour24 = hour12 % 12;
  if (period === "PM") hour24 += 12;
  return `${pad(hour24)}:${pad(minute)}`;
}

function formatDisplay(value: string) {
  const parsed = parseHm(value);
  if (!parsed) return null;
  return `${parsed.hour12}:${pad(parsed.minute)} ${parsed.period}`;
}

function Column({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <p className="px-1 text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </p>
      <div className="flex max-h-48 flex-col gap-1 overflow-y-auto pr-1">{children}</div>
    </div>
  );
}

function OptionButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "h-9 min-w-11 rounded-xl px-2.5 text-sm tabular-nums transition-colors",
        active
          ? "bg-primary text-primary-foreground"
          : "text-foreground hover:bg-muted"
      )}
    >
      {children}
    </button>
  );
}

export function TimePicker({
  value,
  onChange,
  disabled,
  placeholder = "Select time",
  id,
  className,
}: {
  value: string;
  onChange: (next: string) => void;
  disabled?: boolean;
  placeholder?: string;
  id?: string;
  className?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const parsed = parseHm(value) ?? { hour12: 10, minute: 0, period: "AM" as Period };
  const label = formatDisplay(value);

  function commit(next: { hour12: number; minute: number; period: Period }) {
    onChange(toHm(next.hour12, next.minute, next.period));
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            "h-11 w-full justify-start rounded-full px-4 text-left font-normal",
            !label && "text-muted-foreground",
            className
          )}
        >
          <Clock className="mr-2 h-4 w-4 shrink-0 opacity-70" aria-hidden />
          {label ?? placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto rounded-2xl p-3" align="start">
        <div className="flex gap-3">
          <Column label="Hour">
            {HOURS_12.map((hour) => (
              <OptionButton
                key={hour}
                active={parsed.hour12 === hour}
                onClick={() => commit({ ...parsed, hour12: hour })}
              >
                {pad(hour)}
              </OptionButton>
            ))}
          </Column>
          <Column label="Min">
            {MINUTES.map((minute) => (
              <OptionButton
                key={minute}
                active={parsed.minute === minute}
                onClick={() => commit({ ...parsed, minute })}
              >
                {pad(minute)}
              </OptionButton>
            ))}
          </Column>
          <Column label="Period">
            {(["AM", "PM"] as const).map((period) => (
              <OptionButton
                key={period}
                active={parsed.period === period}
                onClick={() => commit({ ...parsed, period })}
              >
                {period}
              </OptionButton>
            ))}
          </Column>
        </div>
        <div className="mt-3 flex justify-end border-t border-border pt-3">
          <Button
            type="button"
            size="sm"
            className="rounded-full"
            onClick={() => setOpen(false)}
          >
            Done
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
