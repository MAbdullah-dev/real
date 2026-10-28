import { RequestReviewButton } from "@/components/agent/request-review-button";
import {
  PropertyReviewHistory,
  type ReviewHistoryEntry,
} from "@/components/property/property-review-history";
import { Button } from "@/components/ui/button";

export function ListingReviewPanel({
  propertyId,
  status,
  actions,
  canRequest,
  alwaysShow = false,
  editHref,
  confirmResubmit = false,
}: {
  propertyId: string;
  status: string;
  actions: ReviewHistoryEntry[];
  canRequest: boolean;
  alwaysShow?: boolean;
  editHref?: string;
  confirmResubmit?: boolean;
}) {
  if (!alwaysShow && status !== "rejected" && actions.length === 0) return null;

  const latestRejection = actions.find((entry) => entry.action === "rejected");

  return (
    <section className="space-y-4 rounded-3xl border border-border/70 bg-card/70 p-5 sm:p-6">
      <div>
        <h2 className="text-base font-semibold tracking-tight sm:text-lg">
          {status === "rejected" ? "Changes Required" : "Review history"}
        </h2>
        {status === "rejected" ? (
          <p className="mt-1 text-sm text-muted-foreground">
            Your property needs a few changes before it can be published. Saving edits keeps it
            unpublished until you request review.
          </p>
        ) : status === "pending_review" ? (
          <p className="mt-1 text-sm text-muted-foreground">
            This listing is waiting for admin review. It will not go live until an admin approves it.
          </p>
        ) : (
          <p className="mt-1 text-sm text-muted-foreground">Decisions recorded for this listing.</p>
        )}
      </div>
      {status === "rejected" ? (
        <blockquote className="rounded-2xl border border-border/60 bg-muted/20 px-3 py-2.5 text-sm whitespace-pre-wrap">
          {latestRejection?.reason?.trim()
            ? latestRejection.reason
            : "No written feedback was saved for this decision."}
        </blockquote>
      ) : null}
      <PropertyReviewHistory
        actions={actions.map((entry) => ({ ...entry, adminName: null }))}
        variant="seller"
      />
      {status === "rejected" ? (
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" className="rounded-full">
            <a href={editHref ?? "#listing-form"}>{editHref ? "Edit Property" : "Edit & Fix Issues"}</a>
          </Button>
          {canRequest ? (
            <RequestReviewButton
              id={propertyId}
              reason={confirmResubmit ? (latestRejection?.reason?.trim() || null) : undefined}
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              Your account must be approved before you can request review.
            </p>
          )}
        </div>
      ) : null}
    </section>
  );
}
