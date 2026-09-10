import "server-only";

import type { BookingStatus, Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

const bookingInclude = {
  property: {
    select: {
      id: true,
      slug: true,
      title: true,
      city: true,
      agentId: true,
      agent: { select: { name: true } },
    },
  },
} satisfies Prisma.BookingInclude;

export type BookingRow = Prisma.BookingGetPayload<{ include: typeof bookingInclude }>;

export function listUserBookings(userId: string) {
  return prisma.booking.findMany({
    where: { userId },
    include: bookingInclude,
    orderBy: { createdAt: "desc" },
  });
}

export function listUserVisits(userId: string) {
  return prisma.booking.findMany({
    where: { userId, status: "confirmed", visitDate: { not: null } },
    include: bookingInclude,
    orderBy: { visitDate: "asc" },
  });
}

export function listAgentBookings(agentId: string, status?: BookingStatus) {
  return prisma.booking.findMany({
    where: { property: { agentId }, ...(status ? { status } : {}) },
    include: bookingInclude,
    orderBy: { createdAt: "desc" },
  });
}

export function listAllBookings(take = 100) {
  return prisma.booking.findMany({
    include: bookingInclude,
    orderBy: { createdAt: "desc" },
    take,
  });
}

export function listAgentLeads(agentId: string) {
  return prisma.lead.findMany({
    where: { property: { agentId } },
    include: {
      property: { select: { id: true, slug: true, title: true, city: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export function listContactMessages(take = 100) {
  return prisma.contactMessage.findMany({
    orderBy: { createdAt: "desc" },
    take,
  });
}
