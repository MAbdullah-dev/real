"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cancelSubscriptionAction, openBillingPortalAction } from "@/server/actions/billing";

export function SubscriptionControls({
  hasSubscription,
  stripeReady,
}: {
  hasSubscription: boolean;
  stripeReady: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();

  if (!hasSubscription) return null;

  return (
    <div className="flex flex-wrap gap-3">
      {stripeReady ? (
        <Button
          type="button"
          variant="outline"
          className="rounded-full"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const result = await openBillingPortalAction();
              if (result?.error) toast.error(result.error);
            })
          }
        >
          {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Billing portal
        </Button>
      ) : null}
      <Button
        type="button"
        variant="ghost"
        className="rounded-full text-destructive"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const result = await cancelSubscriptionAction();
            if (result?.error) {
              toast.error(result.error);
              return;
            }
            toast.success(result?.message ?? "Subscription cancelled");
            router.refresh();
          })
        }
      >
        Cancel plan
      </Button>
    </div>
  );
}
