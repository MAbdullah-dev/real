"use client";

import { LayoutWide } from "@/components/layout/shell";
import { PropertyCard } from "@/components/property/property-card";
import { EmptyState } from "@/components/ui/empty-state";
import { useWishlistStore } from "@/store/wishlist-store";
import type { Property } from "@/types";
import { Heart } from "lucide-react";

export function WishlistGrid({
  properties,
  signedIn = false,
}: {
  properties: Property[];
  signedIn?: boolean;
}) {
  const ids = useWishlistStore((s) => s.ids);
  const saved = signedIn ? properties : properties.filter((p) => ids.includes(p.id));

  return (
    <LayoutWide className="py-12 sm:py-14 lg:py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Saved properties</h1>
      <p className="mt-2 text-muted-foreground">
        {signedIn
          ? "Your shortlist is saved to your account."
          : "Your shortlist syncs locally until you sign in."}
      </p>
      {saved.length === 0 ? (
        <EmptyState
          className="mt-10"
          icon={Heart}
          title="No saved homes yet"
          description="Tap the heart on any listing to build a curated portfolio for your next trip or acquisition."
          action={{ label: "Browse properties", href: "/search" }}
        />
      ) : (
        <div className="mt-10 grid gap-8 sm:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3">
          {saved.map((p, i) => (
            <PropertyCard key={p.id} property={p} index={i} layout="showcase" />
          ))}
        </div>
      )}
    </LayoutWide>
  );
}
