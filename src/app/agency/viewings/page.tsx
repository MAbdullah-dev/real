import { Suspense } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { ViewingInbox } from "@/components/viewings/viewing-inbox";

export const metadata = { title: "Viewings" };

export default function AgencyViewingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Viewings</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Confirm a time, offer an alternative, or decline. The buyer is notified either way.
        </p>
      </div>
      <Suspense fallback={<Skeleton className="h-64 w-full rounded-3xl" />}>
        <ViewingInbox emptyHref="/agency/properties" />
      </Suspense>
    </div>
  );
}
