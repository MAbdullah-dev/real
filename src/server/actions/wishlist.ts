"use server";

import { updateTag } from "next/cache";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

/**
 * Folds anything saved while signed out into the account, then returns the
 * account's full list so the client store matches the database.
 */
export async function mergeWishlist(ids: string[]): Promise<string[]> {
  const session = await auth();
  if (!session?.user?.id) return [];

  const unique = [...new Set(ids)].slice(0, 100);
  if (unique.length > 0) {
    const properties = await prisma.property.findMany({
      where: { id: { in: unique }, status: "published" },
      select: { id: true },
    });
    await prisma.wishlistItem.createMany({
      data: properties.map((p) => ({ userId: session.user.id, propertyId: p.id })),
      skipDuplicates: true,
    });
    updateTag("wishlist");
  }

  const saved = await prisma.wishlistItem.findMany({
    where: { userId: session.user.id },
    select: { propertyId: true },
  });
  return saved.map((item) => item.propertyId);
}

export async function toggleWishlist(propertyId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false as const, reason: "unauthenticated" as const };
  }

  const existing = await prisma.wishlistItem.findUnique({
    where: {
      userId_propertyId: { userId: session.user.id, propertyId },
    },
  });

  if (existing) {
    await prisma.wishlistItem.delete({ where: { id: existing.id } });
  } else {
    await prisma.wishlistItem.create({
      data: { userId: session.user.id, propertyId },
    });
  }

  updateTag("wishlist");
  return { ok: true as const, saved: !existing };
}
