import { BellRing } from "lucide-react";
import { Suspense } from "react";

import { NotificationList } from "@/components/dashboard/notification-list";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { requireAuth } from "@/server/auth";
import { listNotifications } from "@/server/notifications";

async function Notifications() {
  const session = await requireAuth();
  const notifications = await listNotifications(session.user.id);

  if (notifications.length === 0) {
    return (
      <EmptyState
        icon={BellRing}
        title="Nothing to catch up on"
        description="Booking updates and agent replies land here."
        action={{ label: "Browse properties", href: "/search" }}
      />
    );
  }

  return (
    <NotificationList
      notifications={notifications.map((item) => ({
        id: item.id,
        title: item.title,
        body: item.body,
        read: item.readAt != null,
        createdAt: item.createdAt.toISOString(),
      }))}
    />
  );
}

export default function NotificationsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Notifications</h1>
      <Suspense fallback={<Skeleton className="h-48 w-full rounded-3xl" />}>
        <Notifications />
      </Suspense>
    </div>
  );
}
