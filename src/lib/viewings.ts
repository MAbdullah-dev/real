import type { BookingStatus, VisitMode } from "@prisma/client";

export const VIEWING_STATUS_LABELS: Record<BookingStatus, string> = {
  pending: "Awaiting reply",
  proposed: "New time offered",
  awaiting_admin: "Awaiting platform",
  admin_proposed: "Platform offered a new time",
  confirmed: "Confirmed",
  declined: "Declined",
  cancelled: "Cancelled",
  completed: "Completed",
  no_show: "Missed",
};

/** What the buyer should understand from each state. */
export const VIEWING_STATUS_HINTS: Record<BookingStatus, string> = {
  pending: "The owner has your selected time and will approve or offer another.",
  proposed: "The owner offered a different time — accept it or pick another of their slots.",
  awaiting_admin: "You and the owner agree. The platform is confirming the appointment.",
  admin_proposed: "The platform offered a new time. You and the owner both need to accept it.",
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
  awaiting_admin: "secondary",
  admin_proposed: "accent",
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
export const MAX_AVAILABILITY_SLOTS = 12;

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

/** Agency hosts may still lock a time themselves. Seller “confirm” is remapped to awaiting_admin. */
export const HOST_TRANSITIONS: Record<string, BookingStatus[]> = {
  confirmed: ["pending", "proposed", "awaiting_admin", "admin_proposed"],
  proposed: ["pending", "confirmed", "awaiting_admin"],
  declined: ["pending", "proposed"],
  completed: ["confirmed"],
  no_show: ["confirmed"],
  cancelled: ["pending", "proposed", "awaiting_admin", "admin_proposed", "confirmed"],
};

export function toDatetimeLocal(date: Date | string) {
  const value = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(value.valueOf())) return "";
  return new Date(value.getTime() - value.getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 16);
}

export function slotKey(date: Date) {
  return date.valueOf();
}

export function isAllowedAvailabilitySlot(available: Date[], picked: Date) {
  const key = slotKey(picked);
  return available.some((slot) => slotKey(slot) === key);
}

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

/** Seller availability windows — same notice rules, more slots allowed. */
export function parseAvailabilitySlots(
  values: string[],
  now = Date.now()
): { slots: Date[] } | { error: string } {
  const earliest = now + MIN_LEAD_HOURS * 3_600_000;
  const latest = now + MAX_DAYS_AHEAD * 24 * 3_600_000;
  const seen = new Set<number>();
  const slots: Date[] = [];

  for (const value of values) {
    if (!value) continue;
    const time = Date.parse(value);
    if (Number.isNaN(time)) return { error: "Pick a valid date and time." };
    if (time < earliest) {
      return {
        error: `Give at least ${MIN_LEAD_HOURS} hours notice so buyers can book.`,
      };
    }
    if (time > latest) {
      return { error: `Pick times within the next ${MAX_DAYS_AHEAD} days.` };
    }
    if (seen.has(time)) continue;
    seen.add(time);
    slots.push(new Date(time));
  }

  if (slots.length === 0) return { error: "Add at least one available time." };
  if (slots.length > MAX_AVAILABILITY_SLOTS) {
    return { error: `Add at most ${MAX_AVAILABILITY_SLOTS} available times.` };
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
