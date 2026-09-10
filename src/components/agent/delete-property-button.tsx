"use client";

import { Trash2 } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { deletePropertyAction } from "@/server/actions/properties";

export function DeletePropertyButton({ id }: { id: string }) {
  const [pending, startTransition] = React.useTransition();
  const [confirming, setConfirming] = React.useState(false);

  return (
    <Button
      type="button"
      variant={confirming ? "destructive" : "ghost"}
      size="sm"
      className="rounded-full"
      disabled={pending}
      onClick={() => {
        if (!confirming) {
          setConfirming(true);
          return;
        }
        startTransition(async () => {
          const result = await deletePropertyAction(id);
          if (result?.error) {
            toast.error(result.error);
            setConfirming(false);
          }
        });
      }}
      onBlur={() => setConfirming(false)}
    >
      <Trash2 className="mr-2 h-4 w-4" />
      {confirming ? "Confirm delete" : "Delete"}
    </Button>
  );
}
