import { create } from "zustand";
import { persist } from "zustand/middleware";

interface WishlistState {
  ids: string[];
  toggle: (id: string) => void;
  /** Replaces local state with the account's saved list after sign-in. */
  replace: (ids: string[]) => void;
  has: (id: string) => boolean;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      ids: [],
      toggle: (id) =>
        set((s) => ({
          ids: s.ids.includes(id) ? s.ids.filter((x) => x !== id) : [...s.ids, id],
        })),
      replace: (ids) => set({ ids: [...new Set(ids)] }),
      has: (id) => get().ids.includes(id),
    }),
    { name: "estate-elite-wishlist" }
  )
);
