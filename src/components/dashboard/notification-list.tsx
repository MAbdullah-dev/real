"use client";

import Link from "next/link";
import * as React from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "@/server/actions/notifications";

export type NotificationItem = {
  id: string;
  title: string;
  body: string;
  href: string | null;
  read: boolean;
  createdAt: string;
};

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).valueOf();
  const minutes = Math.round(diff / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

export function NotificationList({ notifications }: { notifications: NotificationItem[] }) {
  const [pending, startTransition] = React.useTransition();
  const unread = notifications.filter((item) => !item.read).length;

  return (
    <div className="space-y-4">
      {unread > 0 ? (
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            {unread} unread notification{unread === 1 ? "" : "s"}
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-full"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                await markAllNotificationsReadAction();
                toast.success("All caught up");
              })
            }
          >
            Mark all read
          </Button>
        </div>
      ) : null}

      <div className="space-y-3">
        {notifications.map((item) => (
          <Card
            key={item.id}
            className={cn("rounded-2xl", !item.read && "border-primary/40 bg-primary/5")}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between gap-4">
                <p className="font-medium">{item.title}</p>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {relativeTime(item.createdAt)}
                </span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{item.body}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {item.href ? (
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="rounded-full"
                    onClick={() => {
                      if (!item.read) void markNotificationReadAction(item.id);
                    }}
                  >
                    <Link href={item.href}>Open</Link>
                  </Button>
                ) : null}
                {!item.read ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="rounded-full px-2"
                    disabled={pending}
                    onClick={() =>
                      startTransition(async () => {
                        await markNotificationReadAction(item.id);
                      })
                    }
                  >
                    Mark read
                  </Button>
                ) : null}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
