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

const STATUS_COPY: Record<string, { title: string; body: string }> = {
  pending_review: {
    title: "Pending review",
    body: "This property is waiting for administrative approval before it can go live.",
  },
  published: {
    title: "Published",
    body: "This listing is live on the public site. Unpublish to pull it from search and detail pages.",
  },
  rejected: {
    title: "Rejected",
    body: "This listing was rejected. The owner was notified. You can publish it if the issues are resolved.",
  },
  draft: {
    title: "Draft",
    body: "This listing is still a draft. Publish only if it meets platform standards.",
  },
};

export function AdminPropertyReviewPanel({
  id,
  status,
}: {
  id: string;
  status: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [rejectOpen, setRejectOpen] = React.useState(false);
  const [note, setNote] = React.useState("");

  const copy = STATUS_COPY[status] ?? {
    title: status,
    body: "Choose an appropriate moderation action for this listing.",
  };

  function run(next: "published" | "rejected" | "pending_review", reason?: string) {
    startTransition(async () => {
      const result = await moderatePropertyAction({
        id,
        status: next,
        note: reason?.trim() || undefined,
      });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(
        next === "published"
          ? "Listing published"
          : next === "rejected"
            ? "Listing rejected"
            : "Listing unpublished"
      );
      setRejectOpen(false);
      setNote("");
      router.refresh();
    });
  }

  return (
    <section className="space-y-4 rounded-3xl border border-border/70 bg-card/70 p-5 sm:p-6">
      <div>
        <h2 className="text-base font-semibold tracking-tight sm:text-lg">Moderation</h2>
        <p className="mt-1 text-sm font-medium">{copy.title}</p>
        <p className="mt-1 text-sm text-muted-foreground">{copy.body}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {status === "pending_review" || status === "draft" || status === "rejected" ? (
          <Button
            type="button"
            className="rounded-full"
            disabled={pending}
            onClick={() => run("published")}
          >
            {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden /> : null}
            {status === "pending_review" ? "Approve / Publish" : "Publish"}
          </Button>
        ) : null}

        {status === "published" ? (
          <Button
            type="button"
            variant="outline"
            className="rounded-full"
            disabled={pending}
            onClick={() => run("pending_review")}
          >
            {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden /> : null}
            Unpublish
          </Button>
        ) : null}

        {status !== "rejected" ? (
          <Button
            type="button"
            variant="destructive"
            className="rounded-full"
            disabled={pending}
            onClick={() => setRejectOpen(true)}
          >
            Reject
          </Button>
        ) : null}
      </div>

      <Dialog open={rejectOpen} onOpenChange={(open) => !pending && setRejectOpen(open)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject this listing?</DialogTitle>
            <DialogDescription>
              The owner is notified. Property records do not store a rejection note field — your
              reason is included in their notification only.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor={`reject-note-${id}`}>Reason</Label>
            <Textarea
              id={`reject-note-${id}`}
              rows={4}
              maxLength={2000}
              value={note}
              disabled={pending}
              placeholder="What needs to change before this can go live?"
              onChange={(event) => setNote(event.target.value)}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="rounded-full"
              disabled={pending}
              onClick={() => setRejectOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="rounded-full"
              disabled={pending || !note.trim()}
              onClick={() => run("rejected", note)}
            >
              {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden /> : null}
              Confirm reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
