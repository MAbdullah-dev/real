import { Suspense } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { requireRole } from "@/server/auth";

/** The session read is uncached, so it has to sit behind its own boundary. */
async function BrokerGuard({ children }: { children: React.ReactNode }) {
  await requireRole(["BROKER", "ADMIN"]);
  return children;
}

export default function BrokerOnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<Skeleton className="h-[32rem] w-full rounded-3xl" />}>
      <BrokerGuard>{children}</BrokerGuard>
    </Suspense>
  );
}
