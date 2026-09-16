import "server-only";

import { connection } from "next/server";

import { prisma } from "@/lib/prisma";

function startOfUtcDay(date = new Date()) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function lastNDays(days: number) {
  const today = startOfUtcDay();
  return Array.from({ length: days }, (_, index) => {
    const date = new Date(today);
    date.setUTCDate(date.getUTCDate() - (days - 1 - index));
    return date;
  });
}

async function bump(propertyId: string, field: "views" | "leads") {
  const date = startOfUtcDay();
  await prisma.propertyViewDaily.upsert({
    where: { propertyId_date: { propertyId, date } },
    update: { [field]: { increment: 1 } },
    create: { propertyId, date, [field]: 1 },
  });
}

export function recordPropertyView(propertyId: string) {
  return bump(propertyId, "views").catch(() => undefined);
}

export function recordPropertyLead(propertyId: string) {
  return bump(propertyId, "leads").catch(() => undefined);
}

export type DailyPoint = { label: string; date: string; views: number; leads: number };

/** Daily views/leads for the last `days`, zero-filled. Pass `agencyId` for an agency console. */
export async function getDailyStats(days = 14, agencyId?: string): Promise<DailyPoint[]> {
  await connection();
  const dates = lastNDays(days);
  const rows = await prisma.propertyViewDaily.groupBy({
    by: ["date"],
    where: {
      date: { gte: dates[0] },
      ...(agencyId ? { property: { agencyId } } : {}),
    },
    _sum: { views: true, leads: true },
  });

  const byDate = new Map(rows.map((row) => [row.date.toISOString().slice(0, 10), row._sum]));

  return dates.map((date) => {
    const key = date.toISOString().slice(0, 10);
    const sum = byDate.get(key);
    return {
      date: key,
      label: date.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" }),
      views: sum?.views ?? 0,
      leads: sum?.leads ?? 0,
    };
  });
}

export async function getAgentKpis(agencyId: string) {
  const [active, bookings, pendingBookings, leads, totals] = await Promise.all([
    prisma.property.count({ where: { agencyId, status: "published" } }),
    prisma.booking.count({ where: { property: { agencyId } } }),
    prisma.booking.count({ where: { property: { agencyId }, status: "pending" } }),
    prisma.lead.count({ where: { property: { agencyId } } }),
    prisma.propertyViewDaily.aggregate({
      where: { property: { agencyId } },
      _sum: { views: true, leads: true },
    }),
  ]);

  const views = totals._sum.views ?? 0;
  const enquiries = bookings + leads;

  return {
    active,
    bookings,
    pendingBookings,
    leads,
    views,
    conversion: views > 0 ? Math.round((enquiries / views) * 1000) / 10 : 0,
  };
}

export async function getAdminKpis() {
  const [users, brokers, agencies, properties, pendingReview, bookings, activeSubs, plans] =
    await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: "BROKER" } }),
      prisma.user.count({ where: { role: "AGENCY" } }),
      prisma.property.count({ where: { status: "published" } }),
      prisma.property.count({ where: { status: "pending_review" } }),
      prisma.booking.count(),
      prisma.subscription.findMany({
        where: { status: { in: ["active", "trialing"] } },
        include: { plan: { select: { priceMonthly: true } } },
      }),
      prisma.plan.count(),
    ]);

  const mrr = activeSubs.reduce((total, sub) => total + sub.plan.priceMonthly, 0);

  return {
    users,
    agents: brokers + agencies,
    brokers,
    agencies,
    properties,
    pendingReview,
    bookings,
    plans,
    activeSubscriptions: activeSubs.length,
    mrr,
  };
}

/** Monthly recurring revenue by subscription start month, for the admin revenue chart. */
export async function getRevenueByMonth(months = 6) {
  await connection();
  const subs = await prisma.subscription.findMany({
    where: { status: { in: ["active", "trialing"] } },
    include: { plan: { select: { priceMonthly: true } } },
  });

  const now = new Date();
  const buckets = Array.from({ length: months }, (_, index) => {
    const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (months - 1 - index), 1));
    return {
      key: `${date.getUTCFullYear()}-${date.getUTCMonth()}`,
      label: date.toLocaleDateString("en-US", { month: "short", timeZone: "UTC" }),
      total: 0,
    };
  });

  for (const sub of subs) {
    for (const bucket of buckets) {
      const [year, month] = bucket.key.split("-").map(Number);
      const monthEnd = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59));
      if (sub.createdAt <= monthEnd) {
        bucket.total += sub.plan.priceMonthly;
      }
    }
  }

  return buckets.map(({ label, total }) => ({ label, total }));
}
