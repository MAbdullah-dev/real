import "server-only";

import { cacheLife, cacheTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { toProperty } from "@/server/mappers";

/** Ids of every agent with a public profile, for `generateStaticParams`. */
export async function listPublicAgentIds() {
  "use cache";
  cacheTag("agents");
  cacheLife("hours");

  return prisma.user.findMany({
    where: { role: "AGENT" },
    select: { id: true },
  });
}

export async function getPublicAgent(id: string) {
  "use cache";
  // `bookings` is included because the performance snapshot counts visit requests.
  cacheTag("agents", "properties", "bookings", `agent-${id}`);
  cacheLife("hours");

  const agentSelect = {
    id: true,
    name: true,
    image: true,
    agentProfile: { select: { agency: true, phone: true, verified: true } },
  };

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      agentProfile: true,
      properties: {
        where: { status: "published" },
        include: { images: true, agent: { select: agentSelect } },
        orderBy: { rating: "desc" },
      },
    },
  });

  if (!user || user.role !== "AGENT") return undefined;

  const [completedVisits, totalBookings, plan] = await Promise.all([
    prisma.booking.count({ where: { property: { agentId: id }, status: "completed" } }),
    prisma.booking.count({ where: { property: { agentId: id } } }),
    prisma.subscription.findFirst({
      where: { userId: id, status: { in: ["active", "trialing"] } },
      select: { plan: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const rated = user.properties.filter((property) => property.reviewCount > 0);
  const averageRating = rated.length
    ? rated.reduce((total, property) => total + property.rating, 0) / rated.length
    : null;

  return {
    id: user.id,
    name: user.name ?? "Agent",
    image: user.image ?? "",
    agency: user.agentProfile?.agency ?? null,
    phone: user.agentProfile?.phone ?? null,
    bio:
      user.agentProfile?.bio ??
      "Represents institutional and private clients with a focus on discreet transactions, media-forward listings, and white-glove visit planning.",
    verified: user.agentProfile?.verified ?? false,
    listings: user.properties.map(toProperty),
    planName: plan?.plan.name ?? null,
    totalBookings,
    completedVisits,
    averageRating,
  };
}
