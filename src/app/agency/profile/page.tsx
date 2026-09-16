import { Suspense } from "react";

import { AgentProfileForm } from "@/components/agent/agent-profile-form";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { requireAgency } from "@/server/agency";

async function AgentProfileContent() {
  const { agency } = await requireAgency();

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <Badge variant={agency?.status === "active" ? "default" : "secondary"} className="capitalize">
          {agency?.status?.replaceAll("_", " ") ?? "unknown"}
        </Badge>
        {agency?.statusNote ? (
          <p className="text-sm text-muted-foreground">{agency.statusNote}</p>
        ) : null}
      </div>
      <AgentProfileForm
        defaultValues={{
          agency: agency?.name ?? "",
          phone: agency?.phone ?? "",
          bio: agency?.bio ?? "",
        }}
      />
    </>
  );
}

export default function AgentProfilePage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Agency profile</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Public contact details shown on your listings and profile page.
        </p>
      </div>
      <Suspense fallback={<Skeleton className="h-64 w-full rounded-3xl" />}>
        <AgentProfileContent />
      </Suspense>
    </div>
  );
}
