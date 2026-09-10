import "server-only";

import { prisma } from "@/lib/prisma";

export const ADMIN_SETTINGS = [
  {
    key: "autoPublishListings",
    label: "Auto-publish agent listings",
    description: "Skip manual review and publish submitted listings immediately.",
  },
  {
    key: "allowAgentSignup",
    label: "Allow agent self-signup",
    description: "Let visitors register directly as agents.",
  },
  {
    key: "maintenanceBanner",
    label: "Show maintenance banner",
    description: "Display a site-wide notice about scheduled work.",
  },
] as const;

export type AdminSettingKey = (typeof ADMIN_SETTINGS)[number]["key"];

export async function getAdminSettings() {
  const rows = await prisma.adminSetting.findMany();
  const stored = new Map(rows.map((row) => [row.key, row.value]));
  return ADMIN_SETTINGS.map((setting) => ({
    ...setting,
    value: stored.get(setting.key) ?? false,
  }));
}

export async function isSettingEnabled(key: AdminSettingKey) {
  const row = await prisma.adminSetting.findUnique({ where: { key } });
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
  const agents = await prisma.user.findMany({
    where: { role: "AGENT" },
    select: {
      id: true,
      name: true,
      email: true,
      agentProfile: { select: { agency: true, phone: true, verified: true } },
      _count: { select: { properties: true } },
      subscriptions: {
        where: { status: { in: ["active", "trialing"] } },
        select: { plan: { select: { name: true } } },
        take: 1,
        orderBy: { createdAt: "desc" },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return agents.map((agent) => ({
    id: agent.id,
    name: agent.name ?? "Unnamed agent",
    email: agent.email ?? "",
    agency: agent.agentProfile?.agency ?? "—",
    verified: agent.agentProfile?.verified ?? false,
    listings: agent._count.properties,
    plan: agent.subscriptions[0]?.plan.name ?? "Free",
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
