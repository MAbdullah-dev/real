"use client";

import { useSession } from "next-auth/react";
import { useEffect, useRef } from "react";

import { mergeWishlist } from "@/server/actions/wishlist";
import { useWishlistStore } from "@/store/wishlist-store";

export function WishlistSync() {
  const { status } = useSession();
  const ids = useWishlistStore((s) => s.ids);
  const merged = useRef(false);

  useEffect(() => {
    if (status !== "authenticated" || merged.current || ids.length === 0) return;
    merged.current = true;
    void mergeWishlist(ids);
  }, [status, ids]);

  return null;
}
