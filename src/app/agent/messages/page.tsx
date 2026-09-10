import { MessageSquare } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { requireRole } from "@/server/auth";
import { listAgentLeads } from "@/server/bookings";

async function LeadInbox() {
  const session = await requireRole(["AGENT", "ADMIN"]);
  const leads = await listAgentLeads(session.user.id);

  if (leads.length === 0) {
    return (
      <EmptyState
        icon={MessageSquare}
        title="No enquiries yet"
        description="Messages sent from your listing pages appear here."
        action={{ label: "Review listings", href: "/agent/properties" }}
      />
    );
  }

  return (
    <div className="space-y-3">
      {leads.map((lead) => (
        <Card key={lead.id} className="rounded-2xl">
          <CardContent className="p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-medium">{lead.name}</p>
                <p className="text-sm text-muted-foreground">
                  {lead.email}
                  {lead.phone ? ` · ${lead.phone}` : ""}
                </p>
              </div>
              <span className="text-xs text-muted-foreground">
                {lead.createdAt.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">{lead.message}</p>
            <div className="mt-4 flex flex-wrap gap-4 text-sm">
              <Link
                href={`/properties/${lead.property.slug}`}
                className="font-medium text-primary hover:underline"
              >
                {lead.property.title}
              </Link>
              <a
                href={`mailto:${lead.email}`}
                className="font-medium text-primary hover:underline"
              >
                Reply by email
              </a>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function AgentMessagesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Messages</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Enquiries captured from your listing pages.
        </p>
      </div>
      <Suspense fallback={<Skeleton className="h-64 w-full rounded-3xl" />}>
        <LeadInbox />
      </Suspense>
    </div>
  );
}
