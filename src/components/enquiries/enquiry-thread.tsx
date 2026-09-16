"use client";

import { Loader2, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { replyToLeadAction } from "@/server/actions/leads";

export type ThreadTurn = {
  id: string;
  fromBuyer: boolean;
  body: string;
  createdAt: Date;
};

function stamp(date: Date) {
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function EnquiryThread({
  leadId,
  turns,
  viewer,
  canReply,
  closed,
}: {
  leadId: string;
  turns: ThreadTurn[];
  viewer: "buyer" | "host";
  canReply: boolean;
  closed?: boolean;
}) {
  const router = useRouter();
  const [body, setBody] = React.useState("");
  const [pending, startTransition] = React.useTransition();

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!body.trim()) return;
    startTransition(async () => {
      const result = await replyToLeadAction({ leadId, body });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      setBody("");
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <ol className="space-y-3">
        {turns.map((turn) => {
          const mine = viewer === "buyer" ? turn.fromBuyer : !turn.fromBuyer;
          return (
            <li
              key={turn.id}
              className={cn("flex flex-col gap-1", mine ? "items-end" : "items-start")}
            >
              <div
                className={cn(
                  "max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm",
                  mine
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground"
                )}
              >
                {turn.body}
              </div>
              <span className="text-[11px] text-muted-foreground">
                {mine ? "You" : turn.fromBuyer ? "Buyer" : "Listing contact"} ·{" "}
                {stamp(turn.createdAt)}
              </span>
            </li>
          );
        })}
      </ol>

      {closed ? (
        <p className="rounded-xl bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
          This conversation was closed by the listing contact.
        </p>
      ) : canReply ? (
        <form className="space-y-2" onSubmit={submit}>
          <Textarea
            rows={3}
            maxLength={1500}
            value={body}
            disabled={pending}
            onChange={(event) => setBody(event.target.value)}
            placeholder="Write a reply…"
            aria-label="Reply"
          />
          <div className="flex justify-end">
            <Button
              type="submit"
              size="sm"
              className="rounded-full"
              disabled={pending || !body.trim()}
            >
              {pending ? (
                <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" aria-hidden />
              ) : (
                <Send className="mr-2 h-3.5 w-3.5" aria-hidden />
              )}
              Send
            </Button>
          </div>
        </form>
      ) : (
        <p className="rounded-xl bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
          This enquiry came in without an account, so replies go to{" "}
          <strong>the email on the request</strong> rather than this thread.
        </p>
      )}
    </div>
  );
}
