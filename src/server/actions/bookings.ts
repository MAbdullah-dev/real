"use server";

import { updateTag } from "next/cache";
import type { BookingStatus, Prisma } from "@prisma/client";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { rateLimit, retryMessage } from "@/lib/rate-limit";
import {
  MAX_SLOTS,
  VIEWING_STATUS_LABELS,
  canHostTransition,
  formatInZone,
  isViewingOpen,
  parseSlots,
} from "@/lib/viewings";
import { recordPropertyLead } from "@/server/analytics";
import { hostPropertyScope } from "@/server/bookings";
import { requireAuth } from "@/server/auth";
import { createNotification } from "@/server/notifications";
import { hostViewingsHref } from "@/server/roles";

export type ViewingActionResult = { ok?: true; id?: string; error?: string };

const MS_HOUR = 3_600_000;

const isoFuture = z
  .string()
  .refine((value) => !Number.isNaN(Date.parse(value)), "Pick a valid date and time.");

const requestSchema = z.object({
  propertyId: z.string().min(1),
  phone: z.string().trim().min(6, "Enter a number the agent can reach you on.").max(32),
  mode: z.enum(["in_person", "video"]),
  partySize: z.coerce.number().int().min(1).max(10),
  timezone: z.string().trim().min(1).max(64),
  slots: z.array(isoFuture).min(1, "Pick at least one time.").max(MAX_SLOTS),
  notes: z.string().trim().max(1000).optional().default(""),
});

type NotifiableProperty = {
  id: string;
  slug: string;
  title: string;
  agentId: string;
  sellerId: string | null;
};

/** The manager always hears about it; a represented owner does too. */
async function notifyHosts(property: NotifiableProperty, title: string, body: string) {
  const ids = [property.agentId, ...(property.sellerId ? [property.sellerId] : [])];
  const users = await prisma.user.findMany({
    where: { id: { in: [...new Set(ids)] } },
    select: { id: true, role: true },
  });
  await Promise.all(
    users.map((user) =>
      createNotification(user.id, title, body, hostViewingsHref(user.role))
    )
  );
}

export async function requestViewingAction(
  input: z.input<typeof requestSchema>
): Promise<ViewingActionResult> {
  const session = await requireAuth();
  const parsed = requestSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form." };
  }

  const limit = rateLimit(`viewing:${session.user.id}`, 5, MS_HOUR);
  if (!limit.ok) return { error: retryMessage(limit.retryAfterMs) };

  const values = parsed.data;
  const slotResult = parseSlots(values.slots);
  if ("error" in slotResult) return { error: slotResult.error };

  const property = await prisma.property.findUnique({
    where: { id: values.propertyId },
    select: {
      id: true,
      slug: true,
      title: true,
      status: true,
      agentId: true,
      sellerId: true,
    },
  });
  if (!property || property.status !== "published") {
    return { error: "That listing is no longer accepting viewings." };
  }
  if (property.agentId === session.user.id || property.sellerId === session.user.id) {
    return { error: "This is your own listing — viewing requests come from buyers." };
  }

  const open = await prisma.booking.findFirst({
    where: {
      propertyId: property.id,
      userId: session.user.id,
      status: { in: ["pending", "proposed", "confirmed"] },
    },
    select: { id: true },
  });
  if (open) {
    return {
      error: "You already have an open viewing on this listing — update that one instead.",
    };
  }

  const booking = await prisma.booking.create({
    data: {
      propertyId: property.id,
      userId: session.user.id,
      name: session.user.name ?? "Buyer",
      email: session.user.email ?? "",
      phone: values.phone,
      notes: values.notes,
      mode: values.mode,
      partySize: values.partySize,
      timezone: values.timezone,
      slots: slotResult.slots,
      events: {
        create: {
          status: "pending",
          actorRole: "buyer",
          actorId: session.user.id,
          note: "Viewing requested",
        },
      },
    },
    select: { id: true },
  });

  const first = formatInZone(slotResult.slots[0], values.timezone);
  await Promise.all([
    recordPropertyLead(property.id),
    notifyHosts(
      property,
      "New viewing request",
      `${session.user.name ?? "A buyer"} asked to view ${property.title} — first choice ${first}.`
    ),
  ]);

  updateTag("bookings");
  return { ok: true, id: booking.id };
}

/* ------------------------------------------------------------------ */
/* Lifecycle transitions                                              */
/* ------------------------------------------------------------------ */

const hostSchema = z.object({
  id: z.string().min(1),
  status: z.enum(["confirmed", "proposed", "declined", "completed", "no_show", "cancelled"]),
  visitDate: isoFuture.optional(),
  note: z.string().trim().max(500).optional(),
});

export async function hostUpdateViewingAction(
  input: z.input<typeof hostSchema>
): Promise<ViewingActionResult> {
  const session = await requireAuth();
  const parsed = hostSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Unsupported change." };
  }

  const scope = await hostPropertyScope(session.user.id, session.user.role);
  if (!scope) return { error: "Your account cannot manage viewings." };

  const booking = await prisma.booking.findFirst({
    where: { id: parsed.data.id, property: scope as Prisma.PropertyWhereInput },
    include: {
      property: { select: { id: true, slug: true, title: true, agentId: true, sellerId: true } },
    },
  });
  if (!booking) {
    return { error: "You can only manage viewings on your own listings." };
  }

  const next = parsed.data.status as BookingStatus;
  if (!canHostTransition(booking.status, next)) {
    return {
      error: `A ${VIEWING_STATUS_LABELS[booking.status].toLowerCase()} viewing cannot become ${VIEWING_STATUS_LABELS[next].toLowerCase()}.`,
    };
  }

  let visitDate = booking.visitDate;
  if (next === "confirmed" || next === "proposed") {
    const picked = parsed.data.visitDate ? new Date(parsed.data.visitDate) : booking.slots[0];
    if (!picked) return { error: "Choose the date and time for this viewing." };
    if (picked.valueOf() < Date.now()) return { error: "Pick a time in the future." };
    visitDate = picked;
  }
  if ((next === "completed" || next === "no_show") && (!visitDate || visitDate > new Date())) {
    return { error: "You can only close out a viewing after its scheduled time." };
  }

  await prisma.booking.update({
    where: { id: booking.id },
    data: {
      status: next,
      visitDate,
      statusNote: parsed.data.note || null,
      events: {
        create: {
          status: next,
          actorRole: session.user.role === "ADMIN" ? "admin" : "host",
          actorId: session.user.id,
          note: parsed.data.note || null,
        },
      },
    },
  });

  if (booking.userId) {
    const when = visitDate ? ` — ${formatInZone(visitDate, booking.timezone)}` : "";
    const copy: Record<BookingStatus, string> = {
      pending: "is back in the queue",
      proposed: `has a new time on offer${when}`,
      confirmed: `is confirmed${when}`,
      declined: "was declined",
      cancelled: "was cancelled by the listing contact",
      completed: "was marked complete",
      no_show: "was marked as missed",
    };
    await createNotification(
      booking.userId,
      `Viewing ${VIEWING_STATUS_LABELS[next].toLowerCase()}`,
      `Your viewing of ${booking.property.title} ${copy[next]}.`,
      `/dashboard/viewings/${booking.id}`
    );
  }

  updateTag("bookings");
  return { ok: true };
}

const buyerSchema = z.object({
  id: z.string().min(1),
  intent: z.enum(["accept", "cancel", "reschedule"]),
  reason: z.string().trim().max(500).optional(),
  slots: z.array(isoFuture).max(MAX_SLOTS).optional(),
});

export async function buyerUpdateViewingAction(
  input: z.input<typeof buyerSchema>
): Promise<ViewingActionResult> {
  const session = await requireAuth();
  const parsed = buyerSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Unsupported change." };
  }

  const booking = await prisma.booking.findFirst({
    where: { id: parsed.data.id, userId: session.user.id },
    include: {
      property: { select: { id: true, slug: true, title: true, agentId: true, sellerId: true } },
    },
  });
  if (!booking) return { error: "That viewing no longer exists." };

  const { intent } = parsed.data;
  let next: BookingStatus;
  let data: Prisma.BookingUpdateInput;
  let hostCopy: string;

  if (intent === "accept") {
    if (booking.status !== "proposed" || !booking.visitDate) {
      return { error: "There is no proposed time to accept." };
    }
    if (booking.visitDate.valueOf() < Date.now()) {
      return { error: "That time has already passed — ask for another one." };
    }
    next = "confirmed";
    data = { statusNote: null };
    hostCopy = `accepted ${formatInZone(booking.visitDate, booking.timezone)} for ${booking.property.title}.`;
  } else if (intent === "cancel") {
    if (!isViewingOpen(booking.status)) {
      return { error: "That viewing is already closed." };
    }
    next = "cancelled";
    data = { statusNote: parsed.data.reason || null };
    hostCopy = `cancelled their viewing of ${booking.property.title}.`;
  } else {
    if (booking.status === "completed") {
      return { error: "Completed viewings cannot be rescheduled — request a new one." };
    }
    // Each reschedule pings the host, so it shares the request budget.
    const limit = rateLimit(`viewing:${session.user.id}`, 5, MS_HOUR);
    if (!limit.ok) return { error: retryMessage(limit.retryAfterMs) };
    const slotResult = parseSlots(parsed.data.slots ?? []);
    if ("error" in slotResult) return { error: slotResult.error };
    next = "pending";
    data = { visitDate: null, statusNote: null, slots: slotResult.slots };
    hostCopy = `proposed new times for ${booking.property.title} — first choice ${formatInZone(
      slotResult.slots[0],
      booking.timezone
    )}.`;
  }

  await prisma.booking.update({
    where: { id: booking.id },
    data: {
      ...data,
      status: next,
      events: {
        create: {
          status: next,
          actorRole: "buyer",
          actorId: session.user.id,
          note: parsed.data.reason || null,
        },
      },
    },
  });

  await notifyHosts(
    booking.property,
    intent === "accept" ? "Viewing confirmed" : "Viewing updated",
    `${booking.name} ${hostCopy}`
  );

  updateTag("bookings");
  return { ok: true };
}
