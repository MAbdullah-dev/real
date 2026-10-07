import "server-only";

import type { BookingStatus, Prisma, Role } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { OPEN_VIEWING_STATUSES, isViewingOpen } from "@/lib/viewings";
import { getMembership } from "@/server/agency";

const bookingInclude = {
  property: {
    select: {
      id: true,
      slug: true,
      title: true,
      city: true,
      address: true,
      availableSlots: true,
      agentId: true,
      agencyId: true,
      sellerId: true,
      agent: { select: { id: true, name: true, image: true } },
      agency: { select: { name: true, phone: true } },
      images: { orderBy: { sortOrder: "asc" }, take: 1, select: { url: true } },
    },
  },
  events: { orderBy: { createdAt: "asc" } },
  assignedBroker: { select: { id: true, name: true, email: true } },
} satisfies Prisma.BookingInclude;

export type ViewingRow = Prisma.BookingGetPayload<{ include: typeof bookingInclude }>;

export function listUserViewings(userId: string) {
  return prisma.booking.findMany({
    where: { userId },
    include: bookingInclude,
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Splits a buyer's viewings into the three things they care about: what is
 * booked, what is still being negotiated, and what is over.
 */
export function groupUserViewings(rows: ViewingRow[]) {
  const now = Date.now();
  const upcoming: ViewingRow[] = [];
  const active: ViewingRow[] = [];
  const past: ViewingRow[] = [];

  for (const row of rows) {
    if (!isViewingOpen(row.status)) past.push(row);
    else if (row.status === "confirmed" && (row.visitDate?.valueOf() ?? 0) >= now)
      upcoming.push(row);
    else active.push(row);
  }

  upcoming.sort((a, b) => (a.visitDate?.valueOf() ?? 0) - (b.visitDate?.valueOf() ?? 0));
  return { upcoming, active, past };
}

export async function listBuyerAvailability(propertyId: string, posted: Date[] | string[]) {
  const now = Date.now();
  const takenRows = await prisma.booking.findMany({
    where: {
      propertyId,
      status: { in: OPEN_VIEWING_STATUSES },
      visitDate: { not: null },
    },
    select: { visitDate: true },
  });
  const taken = takenRows.map((row) => row.visitDate!.toISOString());
  const open = posted
    .map((slot) => new Date(slot))
    .filter((slot) => !Number.isNaN(slot.valueOf()) && slot.valueOf() > now)
    .map((slot) => slot.toISOString());
  return { open, taken };
}

export function getUserViewing(id: string, userId: string) {
  return prisma.booking.findFirst({
    where: { id, userId },
    include: bookingInclude,
  });
}

export function listUserVisits(userId: string) {
  return prisma.booking.findMany({
    where: {
      userId,
      status: { in: ["confirmed", "proposed"] },
      visitDate: { not: null },
    },
    include: bookingInclude,
    orderBy: { visitDate: "asc" },
  });
}

/**
 * Listings a console user may handle.
 * Brokers only act on viewings admin assigned to them.
 * Agencies only see their own listings.
 */
export async function hostPropertyScope(
  userId: string,
  role: Role
): Promise<Prisma.PropertyWhereInput | null> {
  if (role === "ADMIN") return {};
  if (role === "AGENCY") {
    const membership = await getMembership(userId);
    return membership ? { agencyId: membership.agencyId } : null;
  }
  if (role === "BROKER") return { bookings: { some: { assignedBrokerId: userId } } };
  if (role === "SELLER") return { sellerId: userId };
  return null;
}

export async function listHostViewings(
  userId: string,
  role: Role,
  status?: BookingStatus
) {
  if (role === "BROKER") {
    return prisma.booking.findMany({
      where: { assignedBrokerId: userId, ...(status ? { status } : {}) },
      include: bookingInclude,
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    });
  }
  const property = await hostPropertyScope(userId, role);
  if (!property) return [];
  return prisma.booking.findMany({
    where: { property, ...(status ? { status } : {}) },
    include: bookingInclude,
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });
}

export async function countHostViewings(userId: string, role: Role, status?: BookingStatus) {
  if (role === "BROKER") {
    return prisma.booking.count({
      where: { assignedBrokerId: userId, ...(status ? { status } : {}) },
    });
  }
  const property = await hostPropertyScope(userId, role);
  if (!property) return 0;
  return prisma.booking.count({ where: { property, ...(status ? { status } : {}) } });
}

export function getBookingForAdmin(id: string) {
  return prisma.booking.findUnique({
    where: { id },
    include: bookingInclude,
  });
}

export async function countHostEnquiries(userId: string, role: Role, status?: "open" | "replied" | "closed") {
  const property = await hostPropertyScope(userId, role);
  if (!property) return 0;
  return prisma.lead.count({ where: { property, ...(status ? { status } : {}) } });
}

export function listAllBookings(take = 100) {
  return prisma.booking.findMany({
    include: bookingInclude,
    orderBy: { createdAt: "desc" },
    take,
  });
}

const leadInclude = {
  property: {
    select: { id: true, slug: true, title: true, city: true, agentId: true },
  },
  messages: { orderBy: { createdAt: "asc" } },
} satisfies Prisma.LeadInclude;

export type EnquiryRow = Prisma.LeadGetPayload<{ include: typeof leadInclude }>;

export async function listHostEnquiries(userId: string, role: Role) {
  const property = await hostPropertyScope(userId, role);
  if (!property) return [];
  return prisma.lead.findMany({
    where: { property },
    include: leadInclude,
    orderBy: { lastMessageAt: "desc" },
  });
}

export function listUserEnquiries(userId: string) {
  return prisma.lead.findMany({
    where: { userId },
    include: leadInclude,
    orderBy: { lastMessageAt: "desc" },
  });
}

export function listContactMessages(take = 100) {
  return prisma.contactMessage.findMany({
    orderBy: { createdAt: "desc" },
    take,
  });
}
