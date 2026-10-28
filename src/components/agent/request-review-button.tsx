"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { resubmitPropertyAction } from "@/server/actions/properties";

const NO_REASON = "No written feedback was saved for this decision.";

export function RequestReviewButton({
  id,
  size = "default",
  reason,
}: {
  id: string;
  size?: "sm" | "default";
  /** When set, including null, the seller must acknowledge the saved feedback before resubmitting. */
  reason?: string | null;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [acknowledged, setAcknowledged] = React.useState(false);
  const [pending, startTransition] = React.useTransition();
  const deliberate = reason !== undefined;
  const feedback = reason?.trim() ? reason.trim() : NO_REASON;

  function close() {
    if (pending) return;
    setOpen(false);
    setAcknowledged(false);
  }

  function submit() {
    if (deliberate && !acknowledged) return;
    startTransition(async () => {
      const result = await resubmitPropertyAction(id);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Submitted for review");
      setAcknowledged(false);
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <>
      <Button
        type="button"
        size={size}
        className="rounded-full"
        disabled={pending}
        onClick={() => setOpen(true)}
      >
        {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden /> : null}
        Request Review
      </Button>
      <Dialog open={open} onOpenChange={(next) => (next ? setOpen(true) : close())}>
        <DialogContent className="max-h-[min(85vh,40rem)] w-[calc(100%-2rem)] overflow-y-auto sm:w-full">
          {deliberate ? (
            <>
              <DialogHeader>
                <DialogTitle>Ready to resubmit?</DialogTitle>
                <DialogDescription>
                  Address the requested changes before sending this listing back. It returns to the
                  admin queue and will not go live until an admin approves it.
                </DialogDescription>
              </DialogHeader>
              <blockquote className="rounded-2xl border border-border/60 bg-muted/20 px-3 py-2.5 text-sm whitespace-pre-wrap">
                {feedback}
              </blockquote>
              <label htmlFor={`resubmit-ack-${id}`} className="flex items-start gap-3 text-sm">
                <Checkbox
                  id={`resubmit-ack-${id}`}
                  checked={acknowledged}
                  disabled={pending}
                  onCheckedChange={(value) => setAcknowledged(value === true)}
                  className="mt-0.5"
                />
                <span>I&apos;ve reviewed the feedback and addressed the requested changes.</span>
              </label>
              <DialogFooter>
                <Button type="button" variant="outline" className="rounded-full" disabled={pending} onClick={close}>
                  Cancel
                </Button>
                <Button
                  type="button"
                  className="rounded-full"
                  disabled={pending || !acknowledged}
                  onClick={submit}
                >
                  {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden /> : null}
                  Confirm &amp; Request Review
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Request review?</DialogTitle>
                <DialogDescription>
                  The updated property will return to the admin review queue. It will not go live until an
                  admin approves it.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button type="button" variant="outline" className="rounded-full" disabled={pending} onClick={close}>
                  Cancel
                </Button>
                <Button type="button" className="rounded-full" disabled={pending} onClick={submit}>
                  {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden /> : null}
                  Request Review
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
