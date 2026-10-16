"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { homeForRole } from "@/server/roles";

/** Client pages (seller/broker/agency signup) that cannot await `auth()`. */
export function RedirectIfSignedIn() {
  const { data, status } = useSession();
  const router = useRouter();
  const userId = data?.user?.id;
  const role = data?.user?.role;

  useEffect(() => {
    if (status !== "authenticated" || !userId) return;
    router.replace(homeForRole(role));
  }, [status, userId, role, router]);

  return null;
}
