"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { moderatePropertyAction } from "@/server/actions/admin";

const COPY = {
  reject: {
    title: "Reject Property",
    description: "This property will not be published until the owner makes the requested changes.",
    confirm: "Reject Property",
    placeholder: "What needs to change before this can go live?",
    toast: "Property rejected",
  },
  unpublish: {
    title: "Unpublish Property",
    description: "This property will be removed from the public site and returned to the review queue.",
    confirm: "Unpublish Property",
    placeholder: "Why is this listing being taken offline?",
    toast: "Property unpublished",
  },
} as const;

export function PropertyReviewActions({
  id,
  status,
  size = "default",
}: {
  id: string;
  status: string;
  size?: "sm" | "default";
}) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [dialog, setDialog] = React.useState<keyof typeof COPY | null>(null);
  const [reason, setReason] = React.useState("");

  const copy = dialog ? COPY[dialog] : null;
  const reasonMissing = reason.trim().length === 0;

  function run(next: "published" | "rejected" | "pending_review", note?: string) {
    startTransition(async () => {
      const result = await moderatePropertyAction({
        id,
        status: next,
        reason: note?.trim() || undefined,
      });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(
        next === "published" ? "Property approved and published" : next === "rejected" ? COPY.reject.toast : COPY.unpublish.toast
      );
      setDialog(null);
      setReason("");
      router.refresh();
    });
  }

  if (status !== "pending_review" && status !== "published") return null;

  return (
    <>
      <div className="flex flex-wrap justify-end gap-2">
        {status === "pending_review" ? (
          <Button
            type="button"
            size={size}
            className="rounded-full"
            disabled={pending}
            onClick={() => run("published")}
          >
            {pending && !dialog ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden /> : null}
            Approve & Publish
          </Button>
        ) : null}
        {status === "pending_review" ? (
          <Button
            type="button"
            size={size}
            variant="destructive"
            className="rounded-full"
            disabled={pending}
            onClick={() => {
              setReason("");
              setDialog("reject");
            }}
          >
            Reject
          </Button>
        ) : null}
        {status === "published" ? (
          <Button
            type="button"
            size={size}
            variant="outline"
            className="rounded-full"
            disabled={pending}
            onClick={() => {
              setReason("");
              setDialog("unpublish");
            }}
          >
            Unpublish
          </Button>
        ) : null}
      </div>

      <Dialog open={dialog != null} onOpenChange={(open) => !pending && !open && setDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{copy?.title}</DialogTitle>
            <DialogDescription>{copy?.description}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor={`review-reason-${id}`}>Reason</Label>
            <Textarea
              id={`review-reason-${id}`}
              rows={4}
              maxLength={2000}
              value={reason}
              disabled={pending}
              placeholder={copy?.placeholder}
              onChange={(event) => setReason(event.target.value)}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="rounded-full"
              disabled={pending}
              onClick={() => setDialog(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="rounded-full"
              disabled={pending || reasonMissing || !dialog}
              onClick={() => run(dialog === "reject" ? "rejected" : "pending_review", reason)}
            >
              {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden /> : null}
              {copy?.confirm}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
