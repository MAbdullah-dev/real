import Link from "next/link";
import { Suspense } from "react";

import {
  AgencyStatusControls,
  CredentialReviewButton,
  credentialLabel,
} from "@/components/admin/moderation-controls";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { listAgentsWithStats } from "@/server/admin";

async function AgentsTable() {
  const agents = await listAgentsWithStats();

  if (agents.length === 0) {
    return <p className="text-sm text-muted-foreground">No brokers or agencies yet.</p>;
  }

  return (
    <div className="space-y-6">
      {agents.map((agent) => (
        <div key={agent.id} className="rounded-3xl border border-border p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <Link href={`/agents/${agent.id}`} className="font-medium hover:underline">
                {agent.name}
              </Link>
              <p className="text-xs text-muted-foreground">{agent.email}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {agent.agency} · {agent.plan} · {agent.listings} listings
              </p>
            </div>
            <Badge
              variant={agent.status === "active" ? "default" : "secondary"}
              className="capitalize"
            >
              {agent.status.replaceAll("_", " ")}
            </Badge>
          </div>

          {agent.statusNote ? (
            <p className="mt-3 text-sm text-muted-foreground">Note: {agent.statusNote}</p>
          ) : null}

          {agent.credentials.length > 0 ? (
            <div className="mt-4 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Credentials
              </p>
              {agent.credentials.map((cred) => (
                <div
                  key={cred.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-muted/40 px-3 py-2 text-sm"
                >
                  <div>
                    <p className="font-medium">{credentialLabel(cred.type)}</p>
                    <p className="text-xs text-muted-foreground">
                      {cred.value ?? "—"} · {cred.status}
                      {cred.fileUrl ? (
                        <>
                          {" · "}
                          <a href={cred.fileUrl} target="_blank" rel="noreferrer" className="underline">
                            file
                          </a>
                        </>
                      ) : null}
                    </p>
                  </div>
                  <CredentialReviewButton credentialId={cred.id} status={cred.status} />
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">No credentials uploaded yet.</p>
          )}

          <div className="mt-4">
            <AgencyStatusControls agencyId={agent.agencyId} status={agent.status} />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AdminAgentsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Agencies</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Review credentials and approve agencies before they can publish live listings.
        </p>
      </div>
      <Suspense fallback={<Skeleton className="h-64 w-full rounded-3xl" />}>
        <AgentsTable />
      </Suspense>
    </div>
  );
}
