import type { BookingStatus, VisitMode } from "@prisma/client";

export const VIEWING_STATUS_LABELS: Record<BookingStatus, string> = {
  pending: "Awaiting seller",
  proposed: "New time offered",
  pending_admin: "Awaiting platform",
  confirmed: "Confirmed",
  declined: "Declined",
  cancelled: "Cancelled",
  completed: "Completed",
  no_show: "Missed",
};

/** What the buyer should understand from each state. */
export const VIEWING_STATUS_HINTS: Record<BookingStatus, string> = {
  pending: "The owner is reviewing the time you picked from their availability.",
  proposed: "A different time is on offer — accept it or pick another available window.",
  pending_admin: "You and the owner agreed. The platform is reviewing the viewing.",
  confirmed: "Locked in. Arrive a few minutes early with photo ID.",
  declined: "This viewing was declined. Try a new time or ask a question.",
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
  pending_admin: "accent",
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

export const OPEN_VIEWING_STATUSES: BookingStatus[] = [
  "pending",
  "proposed",
  "pending_admin",
  "confirmed",
];

export function isViewingOpen(status: BookingStatus) {
  return !TERMINAL_VIEWING_STATUSES.includes(status);
}

/** Buyers must leave the host time to answer, and can't book a year out. */
export const MIN_LEAD_HOURS = 4;
export const MAX_DAYS_AHEAD = 60;
export const MAX_SLOTS = 3;
/** Max availability windows on a listing (not generated slot count). */
export const MAX_AVAILABILITY = 8;
export const MAX_WINDOWS = MAX_AVAILABILITY;

export const VIEW_DURATIONS = [30, 45, 60] as const;
export const VIEW_BUFFERS = [0, 10, 15, 30] as const;
export const DEFAULT_DURATION_MIN = 30;
export const DEFAULT_BUFFER_MIN = 15;

export type ViewDurationMin = (typeof VIEW_DURATIONS)[number];
export type ViewBufferMin = (typeof VIEW_BUFFERS)[number];

export type AvailabilityWindowSpec = {
  start: Date;
  end: Date;
  durationMin: number;
  bufferMin: number;
};

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

/** Agency hosts may still confirm a viewing themselves. */
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

/** Seller listings: owner agrees first, then the platform confirms. */
export const SELLER_TRANSITIONS: Record<string, BookingStatus[]> = {
  pending_admin: ["pending", "proposed"],
  proposed: ["pending", "pending_admin", "confirmed"],
  declined: ["pending", "proposed", "pending_admin"],
  cancelled: ["pending", "proposed", "pending_admin", "confirmed"],
  completed: ["confirmed"],
  no_show: ["confirmed"],
};

export function canSellerTransition(from: BookingStatus, to: BookingStatus) {
  return SELLER_TRANSITIONS[to]?.includes(from) ?? false;
}

export const ADMIN_TRANSITIONS: Record<string, BookingStatus[]> = {
  confirmed: ["pending_admin"],
  proposed: ["pending_admin", "confirmed"],
  declined: ["pending_admin", "proposed"],
  cancelled: ["pending_admin", "confirmed"],
};

export function canAdminTransition(from: BookingStatus, to: BookingStatus) {
  return ADMIN_TRANSITIONS[to]?.includes(from) ?? false;
}

/**
 * Validates buyer-supplied times: far enough out for a human to answer, not
 * absurdly far, de-duplicated, and in chronological order.
 */
export function parseSlots(
  values: string[],
  now = Date.now(),
  max = MAX_SLOTS
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
  if (slots.length > max) {
    return { error: `Pick at most ${max} times.` };
  }
  return { slots: slots.sort((a, b) => a.valueOf() - b.valueOf()) };
}

export function parseAvailability(values: string[], now = Date.now()) {
  return parseSlots(values, now, MAX_AVAILABILITY);
}

export function visitEndOf(start: Date, durationMin = DEFAULT_DURATION_MIN) {
  return new Date(start.valueOf() + durationMin * 60_000);
}

export function intervalsOverlap(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) {
  return aStart.valueOf() < bEnd.valueOf() && aEnd.valueOf() > bStart.valueOf();
}

export function generateSlots(window: AvailabilityWindowSpec): Date[] {
  const durationMs = window.durationMin * 60_000;
  const stepMs = (window.durationMin + window.bufferMin) * 60_000;
  if (durationMs <= 0 || stepMs <= 0) return [];
  const start = window.start.valueOf();
  const end = window.end.valueOf();
  const slots: Date[] = [];
  for (let time = start; time + durationMs <= end; time += stepMs) {
    slots.push(new Date(time));
  }
  return slots;
}

export function generateAllSlots(windows: AvailabilityWindowSpec[]): Date[] {
  return windows
    .flatMap(generateSlots)
    .sort((a, b) => a.valueOf() - b.valueOf())
    .filter((slot, index, rows) => index === 0 || !sameSlot(slot, rows[index - 1]));
}

export function durationForStart(start: Date, windows: AvailabilityWindowSpec[]) {
  for (const window of windows) {
    if (generateSlots(window).some((slot) => sameSlot(slot, start))) return window.durationMin;
  }
  return DEFAULT_DURATION_MIN;
}

/** Legacy exact timestamps become one-slot windows of the default duration. */
export function windowsFromLegacySlots(
  slots: Date[],
  durationMin = DEFAULT_DURATION_MIN,
  bufferMin = DEFAULT_BUFFER_MIN
): AvailabilityWindowSpec[] {
  return slots.map((start) => ({
    start,
    end: visitEndOf(start, durationMin),
    durationMin,
    bufferMin,
  }));
}

export function resolveWindows(
  stored: AvailabilityWindowSpec[] | undefined,
  legacyStarts: Date[]
): AvailabilityWindowSpec[] {
  if (stored && stored.length > 0) return stored;
  if (legacyStarts.length === 0) return [];
  return windowsFromLegacySlots(legacyStarts);
}

export function parseAvailabilityWindows(
  values: Array<{ start: string; end: string; durationMin: number; bufferMin: number }>,
  now = Date.now()
): { windows: AvailabilityWindowSpec[]; slots: Date[] } | { error: string } {
  if (values.length === 0) return { windows: [], slots: [] };
  if (values.length > MAX_WINDOWS) {
    return { error: `Add at most ${MAX_WINDOWS} availability windows.` };
  }

  const earliest = now + MIN_LEAD_HOURS * 3_600_000;
  const latest = now + MAX_DAYS_AHEAD * 24 * 3_600_000;
  const windows: AvailabilityWindowSpec[] = [];

  for (const row of values) {
    const start = Date.parse(row.start);
    const end = Date.parse(row.end);
    if (Number.isNaN(start) || Number.isNaN(end)) {
      return { error: "Pick a valid date, start, and end." };
    }
    if (!VIEW_DURATIONS.includes(row.durationMin as ViewDurationMin)) {
      return { error: "Choose a 30, 45, or 60 minute viewing." };
    }
    if (!VIEW_BUFFERS.includes(row.bufferMin as ViewBufferMin)) {
      return { error: "Choose a 0, 10, 15, or 30 minute buffer." };
    }
    if (end <= start) return { error: "End time must be after the start." };
    if (end > latest) return { error: `Pick times within the next ${MAX_DAYS_AHEAD} days.` };
    const window: AvailabilityWindowSpec = {
      start: new Date(start),
      end: new Date(end),
      durationMin: row.durationMin,
      bufferMin: row.bufferMin,
    };
    const slots = generateSlots(window);
    if (slots.length === 0) {
      return { error: "That window is too short for one complete viewing." };
    }
    if (slots[0].valueOf() < earliest) {
      return {
        error: `Give at least ${MIN_LEAD_HOURS} hours notice so buyers can be confirmed.`,
      };
    }
    windows.push(window);
  }

  windows.sort((a, b) => a.start.valueOf() - b.start.valueOf());
  for (let i = 1; i < windows.length; i += 1) {
    if (intervalsOverlap(windows[i - 1].start, windows[i - 1].end, windows[i].start, windows[i].end)) {
      return { error: "Availability windows cannot overlap." };
    }
  }

  return { windows, slots: generateAllSlots(windows) };
}

export function slotIsGenerated(start: Date, windows: AvailabilityWindowSpec[]) {
  return windows.some((window) => generateSlots(window).some((slot) => sameSlot(slot, start)));
}

export function bookingOccupies(
  visitDate: Date | string | null,
  visitEnd: Date | string | null,
  durationMin: number | null | undefined
): { start: Date; end: Date } | null {
  if (!visitDate) return null;
  const start = new Date(visitDate);
  if (Number.isNaN(start.valueOf())) return null;
  const end = visitEnd ? new Date(visitEnd) : visitEndOf(start, durationMin ?? DEFAULT_DURATION_MIN);
  if (Number.isNaN(end.valueOf())) return { start, end: visitEndOf(start, durationMin ?? DEFAULT_DURATION_MIN) };
  return { start, end };
}

export function occupancyConflicts(
  candidate: { start: Date; end: Date },
  occupied: Array<{ start: Date; end: Date }>
) {
  return occupied.some((row) => intervalsOverlap(candidate.start, candidate.end, row.start, row.end));
}

export function formatSlotRange(start: Date | string, durationMin: number, timezone: string) {
  const from = typeof start === "string" ? new Date(start) : start;
  const to = visitEndOf(from, durationMin);
  const day = formatInZone(from, timezone, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const startClock = formatInZone(from, timezone, { hour: "numeric", minute: "2-digit" });
  const endClock = formatInZone(to, timezone, { hour: "numeric", minute: "2-digit" });
  return `${day} · ${startClock} – ${endClock}`;
}

export function formatClockRange(start: Date | string, durationMin: number, timezone: string) {
  const from = typeof start === "string" ? new Date(start) : start;
  const to = visitEndOf(from, durationMin);
  const startClock = formatInZone(from, timezone, { hour: "numeric", minute: "2-digit" });
  const endClock = formatInZone(to, timezone, { hour: "numeric", minute: "2-digit" });
  return `${startClock} – ${endClock}`;
}

export function dayKey(date: Date | string, timezone: string) {
  const value = typeof date === "string" ? new Date(date) : date;
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(value);
  } catch {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: "UTC",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(value);
  }
}

/** Two instants count as the same viewing window if they are within a minute. */
export function sameSlot(a: Date | string, b: Date | string) {
  return Math.abs(new Date(a).valueOf() - new Date(b).valueOf()) < 60_000;
}

export function slotInList(needle: Date, haystack: Date[]) {
  return haystack.some((slot) => sameSlot(slot, needle));
}

export function toDatetimeLocalValue(date: Date) {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

export function browserTimezone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}
