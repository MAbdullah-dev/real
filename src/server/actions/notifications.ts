"use server";

import { revalidatePath } from "next/cache";

import { requireAuth } from "@/server/auth";
import { prisma } from "@/lib/prisma";

export async function markNotificationReadAction(id: string) {
  const session = await requireAuth();

  await prisma.notification.updateMany({
    where: { id, userId: session.user.id, readAt: null },
    data: { readAt: new Date() },
  });

  revalidatePath("/dashboard/notifications");
  return { ok: true as const };
}

export async function markAllNotificationsReadAction() {
  const session = await requireAuth();

  await prisma.notification.updateMany({
    where: { userId: session.user.id, readAt: null },
    data: { readAt: new Date() },
  });

  revalidatePath("/dashboard/notifications");
  return { ok: true as const };
}
