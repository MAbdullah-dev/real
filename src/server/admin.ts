import "server-only";

import { prisma } from "@/lib/prisma";

export const ADMIN_SETTINGS = [
  {
    key: "autoPublishListings",
    label: "Auto-publish listings",
    description: "Skip manual review and publish submitted listings immediately.",
  },
  {
    key: "allowBrokerSignup",
    label: "Allow broker self-signup",
    description: "Let independent brokers register.",
  },
  {
    key: "allowAgencySignup",
    label: "Allow agency self-signup",
    description: "Let real-estate agencies register.",
  },
  {
    key: "allowSellerSignup",
    label: "Allow seller self-signup",
    description: "Let property owners register and list their own homes.",
  },
  {
    key: "maintenanceBanner",
    label: "Show maintenance banner",
    description: "Display a site-wide notice about scheduled work.",
  },
] as const;

export type AdminSettingKey = (typeof ADMIN_SETTINGS)[number]["key"];

const DEFAULT_ON = new Set([
  "allowBrokerSignup",
  "allowAgencySignup",
  "allowSellerSignup",
]);

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

  const counts = await prisma.property.groupBy({
    by: ["agentId"],
    where: { agencyId: null, sellerId: null },
    _count: { _all: true },
  });
  const byBroker = new Map(counts.map((row) => [row.agentId, row._count._all]));

  return profiles.map((profile) => ({
    id: profile.user.id,
    profileId: profile.id,
    name: profile.user.name ?? "Unnamed broker",
    email: profile.user.email ?? "",
    phone: profile.phone ?? "—",
    city: profile.city ?? "—",
    status: profile.status,
    statusNote: profile.statusNote,
    listings: byBroker.get(profile.userId) ?? 0,
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
