import "server-only";

import type { Role } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { hostPropertyScope } from "@/server/bookings";
import { countUnreadNotifications } from "@/server/notifications";
import { hostEnquiriesHref, hostViewingsHref } from "@/server/roles";

/**
 * Counts of things waiting on the signed-in person, keyed by nav href.
 * Only states that need an action are counted — a badge that never clears is noise.
 */
export async function navBadges(userId: string, role: Role) {
  const badges: Record<string, number> = {};

  const [unread, replies] = await Promise.all([
    countUnreadNotifications(userId),
    prisma.lead.count({ where: { userId, status: "replied" } }),
  ]);

  const buyerNeedsAction = await prisma.booking.count({
    where: { userId, status: { in: ["proposed", "admin_proposed"] } },
  });

  badges["/dashboard/notifications"] = unread;
  badges["/dashboard/viewings"] = buyerNeedsAction;
  badges["/dashboard/messages"] = replies;

  if (role === "ADMIN") {
    badges["/admin/bookings"] = await prisma.booking.count({
      where: { status: { in: ["awaiting_admin", "admin_proposed"] } },
    });
  }

  if (role !== "USER") {
    const scope = await hostPropertyScope(userId, role);
    if (scope) {
      const sellerStatuses =
        role === "SELLER" || role === "BROKER"
          ? (["pending", "admin_proposed"] as const)
          : (["pending"] as const);
      const [pendingViewings, openEnquiries] = await Promise.all([
        prisma.booking.count({
          where: { property: scope, status: { in: [...sellerStatuses] } },
        }),
        prisma.lead.count({ where: { property: scope, status: "open" } }),
      ]);
      badges[hostViewingsHref(role)] = pendingViewings;
      badges[hostEnquiriesHref(role)] = openEnquiries;
    }
  }

  return badges;
}
