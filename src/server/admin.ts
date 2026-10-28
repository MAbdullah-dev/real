import "server-only";

import type { Prisma, PropertyStatus } from "@prisma/client";

import {
  ADMIN_SETTINGS,
  ADMIN_SETTINGS_DEFAULT_ON,
  type AdminSettingKey,
} from "@/data/admin-settings";
import { isAgencyOwned, isSellerOwned } from "@/lib/listing-ownership";
import { prisma } from "@/lib/prisma";

export { ADMIN_SETTINGS, type AdminSettingKey };

export type AdminPropertyTab = "all" | "pending" | "agency" | "seller";

export type AdminPropertyFilters = {
  tab?: AdminPropertyTab;
  q?: string;
  status?: "all" | PropertyStatus;
  city?: string;
  page?: number;
  pageSize?: number;
};

const ADMIN_PROPERTY_PAGE_SIZE = 20;

function adminPropertyWhere(
  filters: AdminPropertyFilters,
  tab: AdminPropertyTab
): Prisma.PropertyWhereInput {
  const where: Prisma.PropertyWhereInput = {};

  if (tab === "pending") {
    where.status = "pending_review";
  } else if (filters.status && filters.status !== "all") {
    where.status = filters.status;
  }

  if (tab === "agency") {
    where.agencyId = { not: null };
  } else if (tab === "seller") {
    where.sellerId = { not: null };
    where.agencyId = null;
  }

  const city = filters.city?.trim();
  if (city && city !== "all") {
    where.city = { equals: city, mode: "insensitive" };
  }

  const q = filters.q?.trim();
  if (q) {
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { city: { contains: q, mode: "insensitive" } },
      { address: { contains: q, mode: "insensitive" } },
      { country: { contains: q, mode: "insensitive" } },
      { agency: { name: { contains: q, mode: "insensitive" } } },
      { seller: { name: { contains: q, mode: "insensitive" } } },
      { agent: { name: { contains: q, mode: "insensitive" } } },
    ];
  }

  return where;
}

/** Lean admin inventory: ownership from agencyId/sellerId, not display names. */
export async function listAdminProperties(filters: AdminPropertyFilters = {}) {
  const tab = filters.tab ?? "all";
  const pageSize = Math.min(
    50,
    Math.max(1, filters.pageSize ?? ADMIN_PROPERTY_PAGE_SIZE)
  );
  const page = Math.max(1, filters.page ?? 1);
  const where = adminPropertyWhere(filters, tab);

  const [rows, total, allCount, pendingCount, agencyCount, sellerCount, cities] =
    await Promise.all([
      prisma.property.findMany({
        where,
        select: {
          id: true,
          slug: true,
          title: true,
          city: true,
          country: true,
          price: true,
          status: true,
          agencyId: true,
          sellerId: true,
          updatedAt: true,
          images: {
            orderBy: [{ isCover: "desc" }, { sortOrder: "asc" }],
            take: 1,
            select: { url: true },
          },
          agency: { select: { name: true } },
          seller: { select: { name: true, email: true } },
          agent: { select: { name: true } },
        },
        orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.property.count({ where }),
      prisma.property.count({ where: adminPropertyWhere(filters, "all") }),
      prisma.property.count({ where: adminPropertyWhere(filters, "pending") }),
      prisma.property.count({ where: adminPropertyWhere(filters, "agency") }),
      prisma.property.count({ where: adminPropertyWhere(filters, "seller") }),
      prisma.property.findMany({
        distinct: ["city"],
        select: { city: true },
        orderBy: { city: "asc" },
      }),
    ]);

  const items = rows.map((row) => {
    const ownerKind = isAgencyOwned(row)
      ? ("agency" as const)
      : isSellerOwned(row)
        ? ("seller" as const)
        : ("unknown" as const);
    const ownerName =
      ownerKind === "agency"
        ? (row.agency?.name ?? "Agency")
        : ownerKind === "seller"
          ? (row.seller?.name ?? row.agent.name ?? row.seller?.email ?? "Seller")
          : (row.agent.name ?? "Unassigned");

    return {
      id: row.id,
      slug: row.slug,
      title: row.title,
      city: row.city,
      country: row.country,
      price: row.price,
      status: row.status,
      image: row.images[0]?.url ?? "",
      ownerKind,
      ownerName,
      updatedAt: row.updatedAt,
    };
  });

  return {
    items,
    total,
    page,
    pageSize,
    pageCount: Math.max(1, Math.ceil(total / pageSize)),
    counts: {
      all: allCount,
      pending: pendingCount,
      agency: agencyCount,
      seller: sellerCount,
    },
    cities: cities.map((row) => row.city).filter(Boolean),
  };
}

/** Full admin review payload for `/admin/properties/[id]`. */
export async function getAdminProperty(id: string) {
  const row = await prisma.property.findUnique({
    where: { id },
    select: {
      id: true,
      slug: true,
      title: true,
      description: true,
      address: true,
      city: true,
      country: true,
      price: true,
      purpose: true,
      bedrooms: true,
      bathrooms: true,
      areaSqm: true,
      furnished: true,
      categories: true,
      amenities: true,
      badges: true,
      videoUrl: true,
      status: true,
      agencyId: true,
      sellerId: true,
      createdAt: true,
      updatedAt: true,
      images: {
        orderBy: [{ isCover: "desc" }, { sortOrder: "asc" }],
        select: { id: true, url: true, isCover: true },
      },
      agency: { select: { id: true, name: true, phone: true, status: true, city: true } },
      seller: {
        select: {
          id: true,
          name: true,
          email: true,
          sellerProfile: { select: { phone: true, status: true, city: true } },
        },
      },
      agent: { select: { id: true, name: true, email: true } },
      availabilityWindows: {
        orderBy: { start: "asc" },
        select: { start: true, end: true, durationMin: true, bufferMin: true },
      },
      _count: { select: { bookings: true, leads: true } },
    },
  });
  if (!row) return null;

  const ownerKind = isAgencyOwned(row)
    ? ("agency" as const)
    : isSellerOwned(row)
      ? ("seller" as const)
      : ("unknown" as const);

  const ownerName =
    ownerKind === "agency"
      ? (row.agency?.name ?? "Agency")
      : ownerKind === "seller"
        ? (row.seller?.name ?? row.agent.name ?? row.seller?.email ?? "Seller")
        : (row.agent.name ?? "Unassigned");

  return {
    ...row,
    ownerKind,
    ownerName,
  };
}

const DEFAULT_ON = new Set<AdminSettingKey>(ADMIN_SETTINGS_DEFAULT_ON);

export async function getAdminSettings() {
  const rows = await prisma.adminSetting.findMany();
  const stored = new Map(rows.map((row) => [row.key, row.value]));
  return ADMIN_SETTINGS.map((setting) => ({
    ...setting,
    value: stored.get(setting.key) ?? DEFAULT_ON.has(setting.key),
  }));
}

export async function isSettingEnabled(key: AdminSettingKey) {
  const row = await prisma.adminSetting.findUnique({ where: { key } });
  if (row == null && DEFAULT_ON.has(key)) return true;
  return row?.value ?? false;
}

export async function listUsers(query?: string) {
  const trimmed = query?.trim();
  return prisma.user.findMany({
    where: trimmed
      ? {
          OR: [
            { name: { contains: trimmed, mode: "insensitive" } },
            { email: { contains: trimmed, mode: "insensitive" } },
          ],
        }
      : undefined,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      _count: { select: { properties: true, bookings: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export async function listAgentsWithStats() {
  const members = await prisma.agencyMember.findMany({
    where: { user: { role: "AGENCY" } },
    include: {
      user: { select: { id: true, name: true, email: true } },
      agency: {
        include: {
          credentials: {
            select: {
              id: true,
              type: true,
              status: true,
              fileUrl: true,
              value: true,
              reviewNote: true,
            },
          },
          subscriptions: {
            where: { status: { in: ["active", "trialing"] } },
            select: { plan: { select: { name: true } } },
            take: 1,
            orderBy: { createdAt: "desc" },
          },
          _count: { select: { properties: true } },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return members.map((member) => ({
    id: member.user.id,
    agencyId: member.agencyId,
    name: member.user.name ?? "Unnamed agency",
    email: member.user.email ?? "",
    agency: member.agency.name ?? "—",
    status: member.agency.status,
    statusNote: member.agency.statusNote,
    listings: member.agency._count.properties,
    plan: member.agency.subscriptions[0]?.plan.name ?? "Free",
    credentials: member.agency.credentials,
    submittedAt: member.agency.submittedAt,
  }));
}

export async function listBrokersWithStats() {
  const profiles = await prisma.brokerProfile.findMany({
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: "asc" },
  });

  return profiles.map((profile) => ({
    id: profile.user.id,
    profileId: profile.id,
    name: profile.user.name ?? "Unnamed broker",
    email: profile.user.email ?? "",
    phone: profile.phone ?? "—",
    city: profile.city ?? "—",
    status: profile.status,
    statusNote: profile.statusNote,
    submittedAt: profile.submittedAt,
  }));
}

export async function listSellersWithStats() {
  const profiles = await prisma.sellerProfile.findMany({
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  const counts = await prisma.property.groupBy({
    by: ["sellerId"],
    where: { sellerId: { not: null } },
    _count: { _all: true },
  });
  const bySeller = new Map(counts.map((row) => [row.sellerId!, row._count._all]));

  return profiles.map((profile) => ({
    id: profile.user.id,
    profileId: profile.id,
    name: profile.user.name ?? "Unnamed seller",
    email: profile.user.email ?? "",
    phone: profile.phone ?? "—",
    city: profile.city ?? "—",
    status: profile.status,
    statusNote: profile.statusNote,
    listings: bySeller.get(profile.userId) ?? 0,
    submittedAt: profile.submittedAt,
  }));
}

export function listAllBlogPosts() {
  return prisma.blogPost.findMany({ orderBy: { updatedAt: "desc" } });
}

export function listAllFaqs() {
  return prisma.faqItem.findMany({ orderBy: { sortOrder: "asc" } });
}

export function listPendingProperties() {
  return prisma.property.findMany({
    where: { status: "pending_review" },
    select: { id: true, title: true, city: true, slug: true },
    orderBy: { updatedAt: "asc" },
  });
}

export function listPendingAgencies() {
  return prisma.agency.findMany({
    where: { status: "pending_review" },
    include: {
      members: {
        where: { role: "owner" },
        include: { user: { select: { id: true, name: true, email: true } } },
        take: 1,
      },
      credentials: true,
    },
    orderBy: { submittedAt: "asc" },
  });
}
