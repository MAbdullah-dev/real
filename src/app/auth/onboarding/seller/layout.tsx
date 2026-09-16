import { Suspense } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { requireRole } from "@/server/auth";

/** The session read is uncached, so it has to sit behind its own boundary. */
async function SellerGuard({ children }: { children: React.ReactNode }) {
  await requireRole(["SELLER", "ADMIN"]);
  return children;
}

export default function SellerOnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<Skeleton className="h-[32rem] w-full rounded-3xl" />}>
      <SellerGuard>{children}</SellerGuard>
    </Suspense>
  );
}
