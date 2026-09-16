"use client";

import { useSession } from "next-auth/react";
import { useEffect, useRef } from "react";

import { mergeWishlist } from "@/server/actions/wishlist";
import { useWishlistStore } from "@/store/wishlist-store";

/**
 * On sign-in, pushes anything saved as a guest into the account and pulls the
 * account list back, so hearts are correct on a device that never saw them.
 */
export function WishlistSync() {
  const { status } = useSession();
  const replace = useWishlistStore((s) => s.replace);
  const synced = useRef(false);

  useEffect(() => {
    if (status !== "authenticated" || synced.current) return;
    synced.current = true;
    void (async () => {
      const ids = await mergeWishlist(useWishlistStore.getState().ids);
      replace(ids);
    })();
  }, [status, replace]);

  return null;
}
