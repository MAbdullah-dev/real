import { Suspense } from "react";

import { requireRole } from "@/server/auth";

async function AgentOnboardingGuard({ children }: { children: React.ReactNode }) {
  await requireRole(["AGENT", "ADMIN"]);
  return children;
}

export default function AgentOnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={null}>
      <AgentOnboardingGuard>{children}</AgentOnboardingGuard>
    </Suspense>
  );
}
