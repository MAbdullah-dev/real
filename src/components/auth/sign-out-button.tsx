"use client";

import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Button, type ButtonProps } from "@/components/ui/button";

async function clearSessionAndGoHome(router: ReturnType<typeof useRouter>) {
  await signOut({ redirect: false });
  router.replace("/");
  router.refresh();
}

export function SignOutButton({
  children = "Sign out",
  disabled,
  ...props
}: Omit<ButtonProps, "onClick" | "type">) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  return (
    <Button
      type="button"
      {...props}
      disabled={pending || disabled}
      onClick={() => {
        if (pending) return;
        setPending(true);
        void clearSessionAndGoHome(router).finally(() => setPending(false));
      }}
    >
      {pending ? "Signing out…" : children}
    </Button>
  );
}

export function SignOutMenuItem() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  return (
    <DropdownMenuItem
      disabled={pending}
      onSelect={(event) => {
        event.preventDefault();
        if (pending) return;
        setPending(true);
        void clearSessionAndGoHome(router).finally(() => setPending(false));
      }}
    >
      {pending ? "Signing out…" : "Sign out"}
    </DropdownMenuItem>
  );
}
