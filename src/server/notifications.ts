import "server-only";

import { prisma } from "@/lib/prisma";

export async function createNotification(
  userId: string,
  title: string,
  body: string,
  href?: string
) {
  return prisma.notification.create({ data: { userId, title, body, href } });
}

export async function listNotifications(userId: string, take = 30) {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take,
  });
}

export async function countUnreadNotifications(userId: string) {
  return prisma.notification.count({ where: { userId, readAt: null } });
}
