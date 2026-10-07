"use server";

import { updateTag } from "next/cache";
import type { BookingStatus, Prisma } from "@prisma/client";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { isSellerOwned } from "@/lib/listing-ownership";
import { rateLimit, retryMessage } from "@/lib/rate-limit";
import {
  MAX_SLOTS,
  OPEN_VIEWING_STATUSES,
  VIEWING_STATUS_LABELS,
  canAdminTransition,
  canHostTransition,
  canSellerTransition,
  formatInZone,
  isViewingOpen,
  parseSlots,
  sameSlot,
  slotInList,
} from "@/lib/viewings";
import { recordPropertyLead } from "@/server/analytics";
import { hostPropertyScope } from "@/server/bookings";
import { requireAuth, requireRole } from "@/server/auth";
import { usersForListingRequests } from "@/server/listing-ownership";
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

type ListingNotify = {
  id: string;
  slug: string;
  title: string;
  agentId: string;
  sellerId: string | null;
  agencyId: string | null;
};

async function notifyUsers(
  users: Array<{ id: string; role?: string }>,
  title: string,
  body: string,
  hrefFor: (role?: string) => string
) {
  await Promise.all(
    users.map((user) => createNotification(user.id, title, body, hrefFor(user.role)))
  );
}

async function notifyAdmins(title: string, body: string) {
  const admins = await prisma.user.findMany({
    where: { role: "ADMIN" },
    select: { id: true },
  });
  await notifyUsers(admins, title, body, () => "/admin/bookings");
}

async function notifySeller(property: ListingNotify, title: string, body: string) {
  if (!property.sellerId) return;
  await createNotification(property.sellerId, title, body, "/seller/viewings");
}

async function notifyBuyer(userId: string | null, title: string, body: string, bookingId: string) {
  if (!userId) return;
  await createNotification(userId, title, body, `/dashboard/viewings/${bookingId}`);
}

/** Agency members for agency listings; the owner only for seller listings. */
async function notifyListingDesk(property: ListingNotify, title: string, body: string) {
  if (isSellerOwned(property) && property.sellerId) {
    await notifySeller(property, title, body);
    return;
  }
  const users = await usersForListingRequests(property);
  await notifyUsers(users, title, body, (role) => hostViewingsHref(role as never));
}

async function takenVisitTimes(propertyId: string, ignoreBookingId?: string) {
  const rows = await prisma.booking.findMany({
    where: {
      propertyId,
      status: { in: OPEN_VIEWING_STATUSES },
      visitDate: { not: null },
      ...(ignoreBookingId ? { id: { not: ignoreBookingId } } : {}),
    },
    select: { visitDate: true },
  });
  return rows.map((row) => row.visitDate!).filter(Boolean);
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
      agencyId: true,
      availableSlots: true,
    },
  });
  if (!property || property.status !== "published") {
    return { error: "That listing is no longer accepting viewings." };
  }
  if (property.agentId === session.user.id || property.sellerId === session.user.id) {
    return { error: "This is your own listing — viewing requests come from buyers." };
  }

  const sellerOwned = isSellerOwned(property);
  const windows = property.availableSlots;
  if (sellerOwned || windows.length > 0) {
    if (windows.length === 0) {
      return { error: "This listing has no viewing times posted yet." };
    }
    if (slotResult.slots.length !== 1) {
      return { error: "Pick one of the times the owner posted." };
    }
    const picked = slotResult.slots[0];
    if (!slotInList(picked, windows)) {
      return { error: "That time is not on the owner's availability." };
    }
    const taken = await takenVisitTimes(property.id);
    if (slotInList(picked, taken)) {
      return { error: "That time was just taken — pick another." };
    }
  }

  const open = await prisma.booking.findFirst({
    where: {
      propertyId: property.id,
      userId: session.user.id,
      status: { in: OPEN_VIEWING_STATUSES },
    },
    select: { id: true },
  });
  if (open) {
    return {
      error: "You already have an open viewing on this listing — update that one instead.",
    };
  }

  const visitDate = slotResult.slots[0];
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
      visitDate,
      buyerAcceptedAt: new Date(),
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

  const first = formatInZone(visitDate, values.timezone);
  await Promise.all([
    recordPropertyLead(property.id),
    notifyListingDesk(
      property,
      "New viewing request",
      `${session.user.name ?? "A buyer"} asked to view ${property.title} — ${first}.`
    ),
  ]);

  updateTag("bookings");
  return { ok: true, id: booking.id };
}

/* ------------------------------------------------------------------ */
/* Agency / seller host transitions                                   */
/* ------------------------------------------------------------------ */

const hostSchema = z.object({
  id: z.string().min(1),
  status: z.enum([
    "confirmed",
    "proposed",
    "pending_admin",
    "declined",
    "completed",
    "no_show",
    "cancelled",
  ]),
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
    where:
      session.user.role === "BROKER"
        ? { id: parsed.data.id, assignedBrokerId: session.user.id }
        : { id: parsed.data.id, property: scope as Prisma.PropertyWhereInput },
    include: {
      property: {
        select: { id: true, slug: true, title: true, agentId: true, sellerId: true, agencyId: true },
      },
    },
  });
  if (!booking) {
    return { error: "You can only manage viewings on your own listings." };
  }

  const next = parsed.data.status as BookingStatus;
  const sellerOwned = isSellerOwned(booking.property);
  const role = session.user.role;

  if (role === "BROKER") {
    if (!canHostTransition(booking.status, next) || (next !== "completed" && next !== "no_show" && next !== "cancelled")) {
      return { error: "Assigned brokers can close out a confirmed viewing, not approve new ones." };
    }
  } else if (sellerOwned && role === "SELLER") {
    if (next === "confirmed") {
      return { error: "The platform confirms seller viewings after you agree the time." };
    }
    if (
      next === "pending_admin" &&
      booking.status === "proposed" &&
      booking.proposedBy !== "admin"
    ) {
      return { error: "Wait for the buyer to accept your offered time." };
    }
    if (!canSellerTransition(booking.status, next)) {
      return {
        error: `A ${VIEWING_STATUS_LABELS[booking.status].toLowerCase()} viewing cannot become ${VIEWING_STATUS_LABELS[next].toLowerCase()}.`,
      };
    }
  } else if (role === "AGENCY" || role === "ADMIN") {
    if (sellerOwned && role === "ADMIN") {
      return { error: "Use the bookings queue to approve seller viewings." };
    }
    if (!canHostTransition(booking.status, next)) {
      return {
        error: `A ${VIEWING_STATUS_LABELS[booking.status].toLowerCase()} viewing cannot become ${VIEWING_STATUS_LABELS[next].toLowerCase()}.`,
      };
    }
  } else {
    return { error: "Your account cannot manage viewings." };
  }

  let visitDate = booking.visitDate;
  if (next === "confirmed" || next === "proposed" || next === "pending_admin") {
    const picked = parsed.data.visitDate ? new Date(parsed.data.visitDate) : booking.visitDate ?? booking.slots[0];
    if (!picked) return { error: "Choose the date and time for this viewing." };
    if (picked.valueOf() < Date.now()) return { error: "Pick a time in the future." };
    visitDate = picked;
  }
  if ((next === "completed" || next === "no_show") && (!visitDate || visitDate > new Date())) {
    return { error: "You can only close out a viewing after its scheduled time." };
  }

  const sellerAcceptingAdmin =
    sellerOwned &&
    role === "SELLER" &&
    booking.status === "proposed" &&
    booking.proposedBy === "admin" &&
    next === "pending_admin";

  let status: BookingStatus = next;
  let sellerAcceptedAt = booking.sellerAcceptedAt;
  let buyerAcceptedAt = booking.buyerAcceptedAt;
  let proposedBy = booking.proposedBy;

  if (sellerAcceptingAdmin) {
    visitDate = booking.visitDate ?? visitDate;
    sellerAcceptedAt = new Date();
    if (booking.buyerAcceptedAt) {
      status = "confirmed";
    } else {
      status = "proposed";
    }
  } else if (next === "pending_admin") {
    sellerAcceptedAt = new Date();
    proposedBy = null;
    if (booking.visitDate && visitDate && !sameSlot(visitDate, booking.visitDate)) {
      status = "proposed";
      proposedBy = "seller";
      buyerAcceptedAt = null;
    }
  } else if (next === "proposed") {
    proposedBy = "seller";
    sellerAcceptedAt = new Date();
    buyerAcceptedAt = null;
  }

  await prisma.booking.update({
    where: { id: booking.id },
    data: {
      status,
      visitDate,
      statusNote: parsed.data.note || null,
      proposedBy,
      sellerAcceptedAt,
      buyerAcceptedAt,
      events: {
        create: {
          status,
          actorRole: role === "ADMIN" ? "admin" : role === "BROKER" ? "broker" : "host",
          actorId: session.user.id,
          note: parsed.data.note || null,
        },
      },
    },
  });

  const when = visitDate ? ` — ${formatInZone(visitDate, booking.timezone)}` : "";
  const title = booking.property.title;

  if (status === "pending_admin") {
    await Promise.all([
      notifyAdmins(
        "Viewing ready for platform review",
        `${booking.name} and the owner agreed a time for ${title}${when}.`
      ),
      notifyBuyer(
        booking.userId,
        "Time sent to the platform",
        `The owner agreed your viewing of ${title}${when}. The platform will confirm it next.`,
        booking.id
      ),
    ]);
  } else if (status === "proposed") {
    await notifyBuyer(
      booking.userId,
      sellerAcceptingAdmin ? "Owner accepted the platform time" : "New viewing time offered",
      sellerAcceptingAdmin
        ? `The owner accepted the platform's time for ${title}${when}. Waiting on you if you have not accepted yet.`
        : `The owner offered a different time for ${title}${when}.`,
      booking.id
    );
  } else if (status === "confirmed" && sellerAcceptingAdmin) {
    await Promise.all([
      notifyBuyer(
        booking.userId,
        "Viewing confirmed",
        `Your viewing of ${title}${when} is confirmed.`,
        booking.id
      ),
      notifyAdmins("Viewing confirmed", `Both parties accepted the platform time for ${title}${when}.`),
    ]);
  } else if (booking.userId && (status === "confirmed" || status === "declined" || status === "cancelled" || status === "completed" || status === "no_show")) {
    const copy: Record<BookingStatus, string> = {
      pending: "is back in the queue",
      proposed: `has a new time on offer${when}`,
      pending_admin: `is with the platform${when}`,
      confirmed: `is confirmed${when}`,
      declined: "was declined",
      cancelled: "was cancelled by the listing contact",
      completed: "was marked complete",
      no_show: "was marked as missed",
    };
    await notifyBuyer(
      booking.userId,
      `Viewing ${VIEWING_STATUS_LABELS[status].toLowerCase()}`,
      `Your viewing of ${title} ${copy[status]}.`,
      booking.id
    );
  }

  updateTag("bookings");
  return { ok: true };
}

/* ------------------------------------------------------------------ */
/* Buyer                                                                */
/* ------------------------------------------------------------------ */

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
      property: {
        select: {
          id: true,
          slug: true,
          title: true,
          agentId: true,
          sellerId: true,
          agencyId: true,
          availableSlots: true,
        },
      },
    },
  });
  if (!booking) return { error: "That viewing no longer exists." };

  const { intent } = parsed.data;
  const sellerOwned = isSellerOwned(booking.property);
  let next: BookingStatus;
  let data: Prisma.BookingUpdateInput;
  let notifyAdmin = false;
  let confirmBoth = false;

  if (intent === "accept") {
    if (booking.status !== "proposed" || !booking.visitDate) {
      return { error: "There is no proposed time to accept." };
    }
    if (booking.visitDate.valueOf() < Date.now()) {
      return { error: "That time has already passed — ask for another one." };
    }
    if (sellerOwned && booking.proposedBy === "admin") {
      const sellerAlready = Boolean(booking.sellerAcceptedAt);
      next = sellerAlready ? "confirmed" : "proposed";
      data = {
        buyerAcceptedAt: new Date(),
        statusNote: null,
        proposedBy: "admin",
      };
      confirmBoth = sellerAlready;
    } else if (sellerOwned) {
      next = "pending_admin";
      data = { buyerAcceptedAt: new Date(), statusNote: null, proposedBy: null };
      notifyAdmin = true;
    } else {
      next = "confirmed";
      data = { statusNote: null };
    }
  } else if (intent === "cancel") {
    if (!isViewingOpen(booking.status)) {
      return { error: "That viewing is already closed." };
    }
    next = "cancelled";
    data = { statusNote: parsed.data.reason || null };
  } else {
    if (booking.status === "completed") {
      return { error: "Completed viewings cannot be rescheduled — request a new one." };
    }
    const limit = rateLimit(`viewing:${session.user.id}`, 5, MS_HOUR);
    if (!limit.ok) return { error: retryMessage(limit.retryAfterMs) };
    const slotResult = parseSlots(parsed.data.slots ?? []);
    if ("error" in slotResult) return { error: slotResult.error };

    if (sellerOwned || booking.property.availableSlots.length > 0) {
      if (slotResult.slots.length !== 1) {
        return { error: "Pick one of the times the owner posted." };
      }
      if (!slotInList(slotResult.slots[0], booking.property.availableSlots)) {
        return { error: "That time is not on the owner's availability." };
      }
      const taken = await takenVisitTimes(booking.propertyId, booking.id);
      if (slotInList(slotResult.slots[0], taken)) {
        return { error: "That time was just taken — pick another." };
      }
    }

    next = "pending";
    data = {
      visitDate: slotResult.slots[0],
      statusNote: null,
      slots: slotResult.slots,
      proposedBy: null,
      buyerAcceptedAt: new Date(),
      sellerAcceptedAt: null,
    };
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

  const when = booking.visitDate ? ` — ${formatInZone(booking.visitDate, booking.timezone)}` : "";
  const title = booking.property.title;

  if (notifyAdmin) {
    await notifyAdmins(
      "Viewing ready for platform review",
      `${booking.name} accepted the owner's time for ${title}${when}.`
    );
    await notifySeller(
      booking.property,
      "Buyer accepted your time",
      `${booking.name} accepted. The platform will confirm ${title}${when}.`
    );
  } else if (confirmBoth) {
    await Promise.all([
      notifySeller(
        booking.property,
        "Viewing confirmed",
        `${booking.name} also accepted. ${title}${when} is confirmed.`
      ),
      notifyAdmins("Viewing confirmed", `Both parties accepted the platform time for ${title}${when}.`),
    ]);
  } else if (intent === "accept" && sellerOwned && next === "proposed") {
    await notifySeller(
      booking.property,
      "Buyer accepted the platform time",
      `${booking.name} accepted the platform's time for ${title}${when}. Waiting on you.`
    );
  } else {
    await notifyListingDesk(
      booking.property,
      intent === "accept" ? "Viewing confirmed" : "Viewing updated",
      `${booking.name} ${
        intent === "cancel"
          ? `cancelled their viewing of ${title}.`
          : intent === "accept"
            ? `accepted ${formatInZone(booking.visitDate!, booking.timezone)} for ${title}.`
            : `proposed a new time for ${title}.`
      }`
    );
  }

  updateTag("bookings");
  return { ok: true };
}

/* ------------------------------------------------------------------ */
/* Admin                                                                */
/* ------------------------------------------------------------------ */

const adminSchema = z.object({
  id: z.string().min(1),
  intent: z.enum(["accept", "reschedule", "decline", "assign", "skip_broker"]),
  visitDate: isoFuture.optional(),
  note: z.string().trim().max(500).optional(),
  brokerUserId: z.string().optional(),
});

export async function adminUpdateViewingAction(
  input: z.input<typeof adminSchema>
): Promise<ViewingActionResult> {
  await requireRole(["ADMIN"]);
  const parsed = adminSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Unsupported change." };
  }

  const booking = await prisma.booking.findUnique({
    where: { id: parsed.data.id },
    include: {
      property: {
        select: {
          id: true,
          slug: true,
          title: true,
          city: true,
          agentId: true,
          sellerId: true,
          agencyId: true,
        },
      },
    },
  });
  if (!booking) return { error: "That viewing no longer exists." };

  const { intent } = parsed.data;
  const whenLabel = (date: Date | null) =>
    date ? ` — ${formatInZone(date, booking.timezone)}` : "";

  if (intent === "assign" || intent === "skip_broker") {
    if (booking.status !== "confirmed") {
      return { error: "Confirm the viewing before assigning a broker." };
    }
    if (intent === "skip_broker") {
      await prisma.booking.update({
        where: { id: booking.id },
        data: {
          assignedBrokerId: null,
          events: {
            create: {
              status: "confirmed",
              actorRole: "admin",
              note: "Platform will handle this viewing without a broker.",
            },
          },
        },
      });
      updateTag("bookings");
      return { ok: true };
    }

    const brokerId = parsed.data.brokerUserId;
    if (!brokerId) return { error: "Pick a broker in this city, or continue without one." };
    const broker = await prisma.user.findFirst({
      where: { id: brokerId, role: "BROKER", brokerProfile: { status: "active" } },
      select: { id: true, name: true },
    });
    if (!broker) return { error: "That broker is not available." };

    const session = await requireAuth();
    await prisma.booking.update({
      where: { id: booking.id },
      data: {
        assignedBrokerId: broker.id,
        events: {
          create: {
            status: "confirmed",
            actorRole: "admin",
            actorId: session.user.id,
            note: `Assigned to ${broker.name ?? "broker"}.`,
          },
        },
      },
    });
    await createNotification(
      broker.id,
      "Viewing assigned to you",
      `${booking.property.title}${whenLabel(booking.visitDate)} is confirmed. Coordinate the visit.`,
      "/broker/viewings"
    );
    updateTag("bookings");
    return { ok: true };
  }

  const next: BookingStatus =
    intent === "accept" ? "confirmed" : intent === "reschedule" ? "proposed" : "declined";
  if (!canAdminTransition(booking.status, next) && !(intent === "reschedule" && booking.status === "proposed")) {
    return {
      error: `A ${VIEWING_STATUS_LABELS[booking.status].toLowerCase()} viewing cannot be ${intent}ed.`,
    };
  }

  let visitDate = booking.visitDate;
  if (intent === "reschedule") {
    if (!parsed.data.visitDate) return { error: "Pick the new date and time." };
    visitDate = new Date(parsed.data.visitDate);
    if (visitDate.valueOf() < Date.now()) return { error: "Pick a time in the future." };
  }
  if (intent === "accept" && (!visitDate || visitDate.valueOf() < Date.now())) {
    return { error: "The agreed time is missing or has passed." };
  }

  const session = await requireAuth();
  await prisma.booking.update({
    where: { id: booking.id },
    data: {
      status: next,
      visitDate,
      statusNote: parsed.data.note || null,
      proposedBy: intent === "reschedule" ? "admin" : booking.proposedBy,
      buyerAcceptedAt: intent === "reschedule" ? null : booking.buyerAcceptedAt,
      sellerAcceptedAt: intent === "reschedule" ? null : booking.sellerAcceptedAt,
      events: {
        create: {
          status: next,
          actorRole: "admin",
          actorId: session.user.id,
          note: parsed.data.note || null,
        },
      },
    },
  });

  const when = whenLabel(visitDate);
  const title = booking.property.title;
  if (intent === "accept") {
    await Promise.all([
      notifyBuyer(
        booking.userId,
        "Viewing confirmed",
        `The platform confirmed your viewing of ${title}${when}.`,
        booking.id
      ),
      notifySeller(
        booking.property,
        "Viewing confirmed",
        `The platform confirmed the viewing of ${title}${when}.`
      ),
    ]);
  } else if (intent === "reschedule") {
    await Promise.all([
      notifyBuyer(
        booking.userId,
        "Platform offered a new time",
        `The platform proposed a new time for ${title}${when}. Please accept or decline.`,
        booking.id
      ),
      notifySeller(
        booking.property,
        "Platform offered a new time",
        `The platform proposed a new time for ${title}${when}. Please accept or decline.`
      ),
    ]);
  } else {
    await Promise.all([
      notifyBuyer(
        booking.userId,
        "Viewing declined",
        `The platform declined the viewing of ${title}.`,
        booking.id
      ),
      notifySeller(booking.property, "Viewing declined", `The platform declined the viewing of ${title}.`),
    ]);
  }

  updateTag("bookings");
  return { ok: true };
}

export async function listBrokersForCity(city: string) {
  await requireRole(["ADMIN"]);
  const needle = city.trim();
  const inCity = await prisma.brokerProfile.findMany({
    where: {
      status: "active",
      city: { equals: needle, mode: "insensitive" },
    },
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { updatedAt: "desc" },
  });
  if (inCity.length > 0) {
    return { city: needle, brokers: inCity, fallback: false as const };
  }
  const all = await prisma.brokerProfile.findMany({
    where: { status: "active" },
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { updatedAt: "desc" },
  });
  return { city: needle, brokers: all, fallback: true as const };
}
