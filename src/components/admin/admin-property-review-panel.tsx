import { PropertyReviewActions } from "@/components/admin/property-review-actions";

const STATUS_COPY: Record<string, { title: string; body: string }> = {
  pending_review: {
    title: "Pending review",
    body: "Approve to make this listing live, or reject it with a reason so the owner can fix it.",
  },
  published: {
    title: "Published",
    body: "This listing is live. Unpublish takes it off the public site and returns it to the review queue.",
  },
  rejected: {
    title: "Rejected",
    body: "This listing failed review. The owner must fix it and request review before it can be approved.",
  },
  draft: {
    title: "Draft",
    body: "The owner has not submitted this listing yet. Review starts after they submit it.",
  },
};

export function AdminPropertyReviewPanel({
  id,
  status,
}: {
  id: string;
  status: string;
}) {
  const copy = STATUS_COPY[status] ?? {
    title: status,
    body: "No moderation action is available for this listing.",
  };

  return (
    <section className="space-y-4 rounded-3xl border border-border/70 bg-card/70 p-5 sm:p-6">
      <div>
        <h2 className="text-base font-semibold tracking-tight sm:text-lg">Moderation</h2>
        <p className="mt-1 text-sm font-medium">{copy.title}</p>
        <p className="mt-1 text-sm text-muted-foreground">{copy.body}</p>
      </div>
      <PropertyReviewActions id={id} status={status} />
    </section>
  );
}
