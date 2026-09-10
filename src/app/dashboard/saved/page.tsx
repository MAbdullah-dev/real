import { Heart } from "lucide-react";
import { Suspense } from "react";

import { PropertyCard } from "@/components/property/property-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { requireAuth } from "@/server/auth";
import { listWishlistProperties } from "@/server/properties";

async function SavedGrid() {
  const session = await requireAuth();
  const properties = await listWishlistProperties(session.user.id);

  if (properties.length === 0) {
    return (
      <EmptyState
        icon={Heart}
        title="Nothing saved yet"
        description="Tap the heart on any listing to keep it here across devices."
        action={{ label: "Browse properties", href: "/search" }}
      />
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
      {properties.map((property, index) => (
        <PropertyCard key={property.id} property={property} index={index} />
      ))}
    </div>
  );
}

export default function SavedPropertiesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Saved properties</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your wishlist, synced to your account.
        </p>
      </div>
      <Suspense fallback={<Skeleton className="h-64 w-full rounded-3xl" />}>
        <SavedGrid />
      </Suspense>
    </div>
  );
}
