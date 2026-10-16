"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

/**
 * Server actions decide the destination; client `signIn` sets the session cookie
 * and updates SessionProvider so the header/nav change without a full reload.
 */
export function useCompleteAuth() {
  const router = useRouter();

  return async function completeAuth(
    result: { error?: string; redirectTo?: string },
    setError: (message: string | null) => void,
    credentials: { email: string; password: string }
  ) {
    if (result.error || !result.redirectTo) {
      const message = result.error ?? "Something went wrong.";
      setError(message);
      toast.error(message);
      return;
    }

    const signed = await signIn("credentials", {
      email: credentials.email,
      password: credentials.password,
      redirect: false,
    });
    if (signed?.error) {
      const message = "Account is ready, but sign-in failed. Please try signing in.";
      setError(message);
      toast.error(message);
      return;
    }

    router.replace(result.redirectTo);
    router.refresh();
  };
}
