import { Suspense } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { requireRole } from "@/server/auth";

/** The session read is uncached, so it has to sit behind its own boundary. */
async function AgencyGuard({ children }: { children: React.ReactNode }) {
  await requireRole(["AGENCY", "ADMIN"]);
  return children;
}

export default function AgencyOnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<Skeleton className="h-[32rem] w-full rounded-3xl" />}>
      <AgencyGuard>{children}</AgencyGuard>
    </Suspense>
  );
}
