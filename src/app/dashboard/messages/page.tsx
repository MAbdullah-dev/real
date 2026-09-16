import { MessageSquare } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { requireAuth } from "@/server/auth";
import { listUserEnquiries } from "@/server/bookings";

export const metadata = { title: "Messages" };

async function ThreadList() {
  const session = await requireAuth();
  const threads = await listUserEnquiries(session.user.id);

  if (threads.length === 0) {
    return (
      <EmptyState
        icon={MessageSquare}
        title="No conversations yet"
        description="Ask a question on any listing and the reply lands here."
        action={{ label: "Browse properties", href: "/search" }}
      />
    );
  }

  return (
    <div className="space-y-3">
      {threads.map((thread) => {
        const last = thread.messages.at(-1);
        return (
          <Link key={thread.id} href={`/dashboard/messages/${thread.id}`} className="block">
            <Card className="rounded-3xl transition-colors hover:border-primary/40">
              <CardContent className="flex flex-wrap items-start justify-between gap-3 p-5">
                <div className="min-w-0">
                  <p className="font-medium">{thread.property.title}</p>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                    {last ? last.body : thread.message}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  <Badge variant={thread.status === "replied" ? "default" : "secondary"}>
                    {thread.status === "replied"
                      ? "New reply"
                      : thread.status === "closed"
                        ? "Closed"
                        : "Sent"}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {thread.lastMessageAt.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}

export default function BuyerMessagesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Messages</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Questions you asked about listings, and the replies.
        </p>
      </div>
      <Suspense fallback={<Skeleton className="h-64 w-full rounded-3xl" />}>
        <ThreadList />
      </Suspense>
    </div>
  );
}
