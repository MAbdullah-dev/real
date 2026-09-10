import { Suspense } from "react";

import { auth } from "@/auth";
import { Skeleton } from "@/components/ui/skeleton";
import { listPublishedProperties, listWishlistProperties } from "@/server/properties";

import { WishlistGrid } from "./wishlist-grid";

async function WishlistContent() {
  const session = await auth();
  const properties = session?.user?.id
    ? await listWishlistProperties(session.user.id)
    : await listPublishedProperties();

  return <WishlistGrid properties={properties} signedIn={Boolean(session?.user)} />;
}

export default function WishlistPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-6xl space-y-6 px-[var(--section-x)] py-10">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 w-full rounded-3xl" />
        </div>
      }
    >
      <WishlistContent />
    </Suspense>
  );
}
