import "server-only";

import { cacheLife, cacheTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { toProperty } from "@/server/mappers";
import { propertyInclude } from "@/server/properties";

/** Public profile ids for agencies (owner) and active independent brokers. */
export async function listPublicAgentIds() {
  "use cache";
  cacheTag("agents");
  cacheLife("hours");

  const [members, brokers] = await Promise.all([
    prisma.agencyMember.findMany({
      where: { agency: { status: "active" }, user: { role: "AGENCY" } },
      select: { userId: true },
    }),
    prisma.brokerProfile.findMany({
      where: { status: "active" },
      select: { userId: true },
    }),
  ]);

  const ids = new Set([...members.map((m) => m.userId), ...brokers.map((b) => b.userId)]);
  return [...ids].map((id) => ({ id }));
}

export async function getPublicAgent(id: string) {
  "use cache";
  cacheTag("agents", "properties", "bookings", `agent-${id}`);
  cacheLife("hours");

  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, name: true, image: true, role: true },
  });
  if (!user) return undefined;

  if (user.role === "AGENCY") {
    const membership = await prisma.agencyMember.findUnique({
      where: { userId: id },
      include: { agency: true },
    });
    if (!membership || membership.agency.status !== "active") return undefined;

    const properties = await prisma.property.findMany({
      where: { agencyId: membership.agencyId, status: "published" },
      include: propertyInclude,
      orderBy: { rating: "desc" },
    });

    const [completedVisits, totalBookings, plan] = await Promise.all([
      prisma.booking.count({
        where: { property: { agencyId: membership.agencyId }, status: "completed" },
      }),
      prisma.booking.count({ where: { property: { agencyId: membership.agencyId } } }),
      prisma.subscription.findFirst({
        where: { agencyId: membership.agencyId, status: { in: ["active", "trialing"] } },
        select: { plan: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const rated = properties.filter((property) => property.reviewCount > 0);
    const averageRating = rated.length
      ? rated.reduce((total, property) => total + property.rating, 0) / rated.length
      : null;

    return {
      id: user.id,
      name: user.name ?? "Agency",
      image: user.image ?? "",
      agency: membership.agency.name ?? null,
      phone: membership.agency.phone ?? null,
      bio: membership.agency.bio ?? "Agency listings and white-glove visit planning.",
      verified: true,
      listings: properties.map(toProperty),
      planName: plan?.plan.name ?? null,
      totalBookings,
      completedVisits,
      averageRating,
    };
  }

  if (user.role === "BROKER") {
    const profile = await prisma.brokerProfile.findUnique({ where: { userId: id } });
    if (!profile || profile.status !== "active") return undefined;

    const properties = await prisma.property.findMany({
      where: { agentId: id, agencyId: null, sellerId: null, status: "published" },
      include: propertyInclude,
      orderBy: { rating: "desc" },
    });

    const [completedVisits, totalBookings] = await Promise.all([
      prisma.booking.count({
        where: { property: { agentId: id, agencyId: null }, status: "completed" },
      }),
      prisma.booking.count({ where: { property: { agentId: id, agencyId: null } } }),
    ]);

    const rated = properties.filter((property) => property.reviewCount > 0);
    const averageRating = rated.length
      ? rated.reduce((total, property) => total + property.rating, 0) / rated.length
      : null;

    return {
      id: user.id,
      name: user.name ?? "Broker",
      image: user.image ?? "",
      agency: profile.title ?? "Independent broker",
      phone: profile.phone ?? profile.whatsapp ?? null,
      bio: profile.bio ?? "Independent broker connecting buyers and sellers.",
      verified: true,
      listings: properties.map(toProperty),
      planName: null,
      totalBookings,
      completedVisits,
      averageRating,
    };
  }

  return undefined;
}
