import "server-only";

import type { BookingStatus, Prisma, Role } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { isViewingOpen } from "@/lib/viewings";
import { getMembership } from "@/server/agency";

const bookingInclude = {
  property: {
    select: {
      id: true,
      slug: true,
      title: true,
      city: true,
      address: true,
      agentId: true,
      agencyId: true,
      sellerId: true,
      agent: { select: { id: true, name: true, image: true } },
      agency: { select: { name: true, phone: true } },
      images: { orderBy: { sortOrder: "asc" }, take: 1, select: { url: true } },
    },
  },
  events: { orderBy: { createdAt: "asc" } },
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
 * Listings a console user is entitled to act on. Brokers keep listings they
 * manage even when a seller owns the asset, so both parties stay in the loop.
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
  if (role === "BROKER") return { agentId: userId, agencyId: null };
  if (role === "SELLER") return { sellerId: userId };
  return null;
}

export async function listHostViewings(
  userId: string,
  role: Role,
  status?: BookingStatus
) {
  const property = await hostPropertyScope(userId, role);
  if (!property) return [];
  return prisma.booking.findMany({
    where: { property, ...(status ? { status } : {}) },
    include: bookingInclude,
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });
}

export async function countHostViewings(userId: string, role: Role, status?: BookingStatus) {
  const property = await hostPropertyScope(userId, role);
  if (!property) return 0;
  return prisma.booking.count({ where: { property, ...(status ? { status } : {}) } });
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
