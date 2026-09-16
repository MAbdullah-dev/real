import type { BookingStatus, VisitMode } from "@prisma/client";

export const VIEWING_STATUS_LABELS: Record<BookingStatus, string> = {
  pending: "Awaiting reply",
  proposed: "New time offered",
  confirmed: "Confirmed",
  declined: "Declined",
  cancelled: "Cancelled",
  completed: "Completed",
  no_show: "Missed",
};

/** What the buyer should understand from each state. */
export const VIEWING_STATUS_HINTS: Record<BookingStatus, string> = {
  pending: "The listing contact has your preferred times and will reply.",
  proposed: "None of your times worked — review the time they offered instead.",
  confirmed: "Locked in. Arrive a few minutes early with photo ID.",
  declined: "This viewing was declined. Try new times or ask a question.",
  cancelled: "This viewing was cancelled.",
  completed: "Viewing done. You can still message the listing contact.",
  no_show: "Marked as missed. Request a new time if you still want to view.",
};

export const VIEWING_STATUS_TONE: Record<
  BookingStatus,
  "default" | "secondary" | "outline" | "accent" | "destructive"
> = {
  pending: "secondary",
  proposed: "accent",
  confirmed: "default",
  declined: "outline",
  cancelled: "outline",
  completed: "outline",
  no_show: "destructive",
};

export const VISIT_MODE_LABELS: Record<VisitMode, string> = {
  in_person: "In person",
  video: "Video call",
};

export const TERMINAL_VIEWING_STATUSES: BookingStatus[] = [
  "declined",
  "cancelled",
  "completed",
  "no_show",
];

export function isViewingOpen(status: BookingStatus) {
  return !TERMINAL_VIEWING_STATUSES.includes(status);
}

/** Buyers must leave the host time to answer, and can't book a year out. */
export const MIN_LEAD_HOURS = 4;
export const MAX_DAYS_AHEAD = 60;
export const MAX_SLOTS = 3;

export function formatInZone(
  date: Date | string,
  timezone: string,
  options: Intl.DateTimeFormatOptions = {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }
) {
  const value = typeof date === "string" ? new Date(date) : date;
  try {
    return new Intl.DateTimeFormat("en-US", { ...options, timeZone: timezone }).format(value);
  } catch {
    // An unknown or spoofed IANA zone must not break the page.
    return new Intl.DateTimeFormat("en-US", { ...options, timeZone: "UTC" }).format(value);
  }
}

/** States a host may move a viewing into, and what it must currently be. */
export const HOST_TRANSITIONS: Record<string, BookingStatus[]> = {
  confirmed: ["pending", "proposed"],
  proposed: ["pending", "confirmed"],
  declined: ["pending", "proposed"],
  completed: ["confirmed"],
  no_show: ["confirmed"],
  cancelled: ["pending", "proposed", "confirmed"],
};

export function canHostTransition(from: BookingStatus, to: BookingStatus) {
  return HOST_TRANSITIONS[to]?.includes(from) ?? false;
}

/**
 * Validates buyer-supplied times: far enough out for a human to answer, not
 * absurdly far, de-duplicated, and in chronological order.
 */
export function parseSlots(
  values: string[],
  now = Date.now()
): { slots: Date[] } | { error: string } {
  const earliest = now + MIN_LEAD_HOURS * 3_600_000;
  const latest = now + MAX_DAYS_AHEAD * 24 * 3_600_000;
  const seen = new Set<number>();
  const slots: Date[] = [];

  for (const value of values) {
    const time = Date.parse(value);
    if (Number.isNaN(time)) return { error: "Pick a valid date and time." };
    if (time < earliest) {
      return {
        error: `Give at least ${MIN_LEAD_HOURS} hours notice so the listing contact can reply.`,
      };
    }
    if (time > latest) {
      return { error: `Pick times within the next ${MAX_DAYS_AHEAD} days.` };
    }
    if (seen.has(time)) continue;
    seen.add(time);
    slots.push(new Date(time));
  }

  if (slots.length === 0) return { error: "Pick at least one time." };
  if (slots.length > MAX_SLOTS) {
    return { error: `Pick at most ${MAX_SLOTS} times.` };
  }
  return { slots: slots.sort((a, b) => a.valueOf() - b.valueOf()) };
}

export function browserTimezone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}
