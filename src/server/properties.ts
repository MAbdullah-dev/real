import "server-only";

import { cacheLife, cacheTag } from "next/cache";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { Property } from "@/types";
import { propertiesByCategory, toProperty, type PropertyWithAgent } from "@/server/mappers";
import type { PropertyFilterParams } from "@/server/property-filters";
import type { PROPERTY_CATEGORIES } from "@/server/property-input";

type PropertyFormCategories = (typeof PROPERTY_CATEGORIES)[number][];

const propertyInclude = {
  images: true,
  agent: {
    select: {
      id: true,
      name: true,
      image: true,
      agentProfile: { select: { agency: true, phone: true, verified: true } },
    },
  },
} satisfies Prisma.PropertyInclude;

function mapMany(rows: PropertyWithAgent[]): Property[] {
  return rows.map(toProperty);
}

export async function listPublishedProperties() {
  "use cache";
  cacheTag("properties");
  cacheLife("hours");

  const rows = await prisma.property.findMany({
    where: { status: "published" },
    include: propertyInclude,
    orderBy: { rating: "desc" },
  });
  return mapMany(rows);
}

export async function getPropertyBySlug(slug: string) {
  "use cache";
  cacheTag("properties", `property-${slug}`);
  cacheLife("hours");

  const row = await prisma.property.findUnique({
    where: { slug },
    include: propertyInclude,
  });
  if (!row || row.status !== "published") return undefined;
  return toProperty(row);
}

export async function getPropertyById(id: string) {
  "use cache";
  cacheTag("properties", `property-id-${id}`);
  cacheLife("hours");

  const row = await prisma.property.findUnique({
    where: { id },
    include: propertyInclude,
  });
  if (!row || row.status !== "published") return undefined;
  return toProperty(row);
}

export async function getPropertiesByCategory(category: string) {
  const all = await listPublishedProperties();
  return propertiesByCategory(all, category);
}

export async function getSimilarProperties(property: Property, limit = 3) {
  const all = await listPublishedProperties();
  return all
    .filter((p) => p.id !== property.id && p.categories.some((c) => property.categories.includes(c)))
    .slice(0, limit);
}

export async function filterProperties(params: PropertyFilterParams) {
  const where: Prisma.PropertyWhereInput = { status: "published" };

  if (params.purpose && params.purpose !== "all") {
    where.purpose = params.purpose;
  }
  if (params.minPrice != null || params.maxPrice != null) {
    where.price = {
      ...(params.minPrice != null ? { gte: params.minPrice } : {}),
      ...(params.maxPrice != null ? { lte: params.maxPrice } : {}),
    };
  }
  if (params.bedrooms != null && params.bedrooms > 0) {
    where.bedrooms = { gte: params.bedrooms };
  }
  if (params.bathrooms != null && params.bathrooms > 0) {
    where.bathrooms = { gte: params.bathrooms };
  }
  if (params.minArea != null) {
    where.areaSqm = { gte: params.minArea };
  }
  if (params.type && params.type !== "all") {
    where.categories = { has: params.type };
  }
  if (params.furnished === "yes") where.furnished = true;
  if (params.furnished === "no") where.furnished = false;
  if (params.q?.trim()) {
    const q = params.q.trim();
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { city: { contains: q, mode: "insensitive" } },
      { address: { contains: q, mode: "insensitive" } },
      { country: { contains: q, mode: "insensitive" } },
    ];
  }

  const rows = await prisma.property.findMany({
    where,
    include: propertyInclude,
    orderBy: { rating: "desc" },
  });
  return mapMany(rows);
}

export async function listAgentProperties(agentId?: string) {
  const rows = await prisma.property.findMany({
    where: agentId ? { agentId } : undefined,
    include: {
      ...propertyInclude,
      _count: { select: { bookings: true, leads: true } },
    },
    orderBy: { updatedAt: "desc" },
  });
  return rows.map((row) => ({
    property: toProperty(row),
    status: row.status,
    agentName: row.agent.name ?? "Unassigned",
    bookings: row._count.bookings,
    leads: row._count.leads,
    updatedAt: row.updatedAt,
  }));
}

/** Raw row (including drafts) for the agent edit form. */
export async function getPropertyForEdit(id: string) {
  const row = await prisma.property.findUnique({
    where: { id },
    include: { images: { orderBy: { sortOrder: "asc" } } },
  });
  if (!row) return undefined;

  return {
    id: row.id,
    agentId: row.agentId,
    slug: row.slug,
    status: row.status,
    values: {
      title: row.title,
      description: row.description,
      address: row.address,
      city: row.city,
      country: row.country,
      price: row.price,
      purpose: row.purpose,
      bedrooms: row.bedrooms,
      bathrooms: row.bathrooms,
      areaSqm: row.areaSqm,
      furnished: row.furnished,
      videoUrl: row.videoUrl ?? "",
      categories: row.categories as PropertyFormCategories,
      amenities: row.amenities.join(", "),
      badges: row.badges.join(", "),
      images: row.images.map((image) => image.url),
      status: row.status === "rejected" ? ("draft" as const) : row.status,
    },
  };
}

/** Slugs and ids of every live listing, for `generateStaticParams`. */
export async function listPublishedPropertyParams() {
  "use cache";
  cacheTag("properties");
  cacheLife("hours");

  return prisma.property.findMany({
    where: { status: "published" },
    select: { id: true, slug: true },
  });
}

export async function countPublishedProperties() {
  return prisma.property.count({ where: { status: "published" } });
}

export async function listWishlistProperties(userId: string) {
  const rows = await prisma.wishlistItem.findMany({
    where: { userId },
    include: {
      property: { include: propertyInclude },
    },
    orderBy: { createdAt: "desc" },
  });

  return rows
    .filter((row) => row.property.status === "published")
    .map((row) => toProperty(row.property));
}
