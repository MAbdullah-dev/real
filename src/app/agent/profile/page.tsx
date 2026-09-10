import { Suspense } from "react";

import { AgentProfileForm } from "@/components/agent/agent-profile-form";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/server/auth";

async function AgentProfileContent() {
  const session = await requireRole(["AGENT", "ADMIN"]);
  const profile = await prisma.agentProfile.findUnique({
    where: { userId: session.user.id },
    select: { agency: true, phone: true, bio: true, verified: true },
  });

  return (
    <Card className="rounded-3xl">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Verification & contact</CardTitle>
        <Badge variant={profile?.verified ? "default" : "secondary"}>
          {profile?.verified ? "Verified" : "Unverified"}
        </Badge>
      </CardHeader>
      <CardContent>
        <AgentProfileForm
          defaultValues={{
            agency: profile?.agency ?? "",
            phone: profile?.phone ?? "",
            bio: profile?.bio ?? "",
          }}
        />
      </CardContent>
    </Card>
  );
}

export default function AgentProfilePage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Agency profile</h1>
      <Suspense fallback={<Skeleton className="h-80 w-full rounded-3xl" />}>
        <AgentProfileContent />
      </Suspense>
    </div>
  );
}
