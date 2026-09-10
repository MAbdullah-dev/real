import { Suspense } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { listContactMessages } from "@/server/bookings";

async function ContactInbox() {
  const messages = await listContactMessages();

  if (messages.length === 0) {
    return <p className="text-sm text-muted-foreground">No contact messages yet.</p>;
  }

  return (
    <div className="space-y-3">
      {messages.map((message) => (
        <Card key={message.id} className="rounded-2xl">
          <CardContent className="p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-medium">{message.name}</p>
                <p className="text-sm text-muted-foreground">
                  {message.email}
                  {message.company ? ` · ${message.company}` : ""}
                </p>
              </div>
              <span className="text-xs text-muted-foreground">
                {message.createdAt.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">{message.message}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function AdminReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Reports</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Inbound contact messages from the public site.
        </p>
      </div>
      <Card className="rounded-3xl border-none bg-transparent shadow-none">
        <CardHeader className="px-0">
          <CardTitle className="text-base">Contact inbox</CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          <Suspense fallback={<Skeleton className="h-64 w-full rounded-3xl" />}>
            <ContactInbox />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
