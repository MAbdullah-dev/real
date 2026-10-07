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

  const [unread, proposed, replies] = await Promise.all([
    countUnreadNotifications(userId),
    prisma.booking.count({ where: { userId, status: "proposed" } }),
    prisma.lead.count({ where: { userId, status: "replied" } }),
  ]);

  badges["/dashboard/notifications"] = unread;
  badges["/dashboard/viewings"] = proposed;
  badges["/dashboard/messages"] = replies;

  if (role === "ADMIN") {
    badges["/admin/bookings"] = await prisma.booking.count({ where: { status: "pending_admin" } });
  }

  if (role !== "USER") {
    const scope = await hostPropertyScope(userId, role);
    if (scope) {
      const viewingWhere =
        role === "BROKER"
          ? { assignedBrokerId: userId, status: "confirmed" as const }
          : role === "SELLER"
            ? {
                property: scope,
                OR: [
                  { status: "pending" as const },
                  { status: "proposed" as const, proposedBy: "admin" },
                ],
              }
            : { property: scope, status: "pending" as const };

      const [pendingViewings, openEnquiries] = await Promise.all([
        prisma.booking.count({ where: viewingWhere }),
        prisma.lead.count({
          where:
            role === "BROKER"
              ? { property: scope, status: "open" }
              : { property: scope, status: "open" },
        }),
      ]);
      badges[hostViewingsHref(role)] = pendingViewings;
      badges[hostEnquiriesHref(role)] = openEnquiries;
    }
  }

  return badges;
}
