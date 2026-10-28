"use client";

import { Button } from "@/components/ui/button";

export default function SellerListingsError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="rounded-3xl border border-dashed border-border px-6 py-16 text-center">
      <h2 className="text-lg font-semibold tracking-tight">We couldn&apos;t load your listings</h2>
      <p className="mt-2 text-sm text-muted-foreground">Something went wrong while reading your properties.</p>
      <Button type="button" className="mt-6 rounded-full" onClick={reset}>
        Retry
      </Button>
    </div>
  );
}
