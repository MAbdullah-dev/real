"use server";

import { updateTag } from "next/cache";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function mergeWishlist(ids: string[]) {
  const session = await auth();
  if (!session?.user?.id || ids.length === 0) return;

  const unique = [...new Set(ids)].slice(0, 100);
  const properties = await prisma.property.findMany({
    where: { id: { in: unique } },
    select: { id: true },
  });

  await prisma.wishlistItem.createMany({
    data: properties.map((p) => ({ userId: session.user.id, propertyId: p.id })),
    skipDuplicates: true,
  });

  updateTag("wishlist");
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
