import { Suspense } from "react";

import { EnquiryInbox } from "@/components/enquiries/enquiry-inbox";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata = { title: "Enquiries" };

export default function SellerEnquiriesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Enquiries</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Questions buyers asked about your property, and your replies.
        </p>
      </div>
      <Suspense fallback={<Skeleton className="h-64 w-full rounded-3xl" />}>
        <EnquiryInbox />
      </Suspense>
    </div>
  );
}
