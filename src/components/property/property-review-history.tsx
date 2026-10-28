import { REVIEW_ACTION_LABEL, type ReviewKind } from "@/server/property-review";

export type ReviewHistoryEntry = {
  id: string;
  action: ReviewKind;
  reason: string | null;
  createdAt: Date;
  adminName: string | null;
};

const SELLER_EVENT: Record<ReviewKind, { title: string; detail: string; next?: string }> = {
  approved: {
    title: "Approved & Published",
    detail: "Your property is now live.",
  },
  rejected: {
    title: "Changes Requested",
    detail: "Your property needs a few changes before it can be published.",
    next: "Update the property information and request another review.",
  },
  unpublished: {
    title: "Temporarily unpublished",
    detail: "Your property was taken off the public site and returned to review.",
    next: "It stays in the review queue until an admin publishes it again.",
  },
  resubmitted: {
    title: "Resubmitted for Review",
    detail: "Your updated listing has been submitted for review.",
  },
};

function formatWhen(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function PropertyReviewHistory({
  actions,
  variant = "admin",
}: {
  actions: ReviewHistoryEntry[];
  variant?: "admin" | "seller";
}) {
  if (actions.length === 0) {
    return variant === "seller" ? (
      <p className="text-sm text-muted-foreground">No review activity yet.</p>
    ) : null;
  }

  return (
    <ol className="space-y-3">
      {actions.map((entry) => {
        const seller = SELLER_EVENT[entry.action];
        return (
          <li key={entry.id} className="rounded-2xl border border-border/60 bg-muted/20 px-3 py-2.5">
            <p className="text-sm font-medium">
              {variant === "seller" ? seller.title : (REVIEW_ACTION_LABEL[entry.action] ?? entry.action)}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {formatWhen(entry.createdAt)}
              {variant === "admin" && entry.adminName ? ` · ${entry.adminName}` : null}
            </p>
            {variant === "seller" ? (
              <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                <p>{seller.detail}</p>
                {entry.reason ? <p className="whitespace-pre-wrap text-foreground">{entry.reason}</p> : null}
                {seller.next ? <p>Next step: {seller.next}</p> : null}
              </div>
            ) : entry.reason ? (
              <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">Reason: {entry.reason}</p>
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
