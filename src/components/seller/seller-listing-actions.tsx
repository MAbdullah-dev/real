"use client";

import { MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

import { DeletePropertyButton } from "@/components/agent/delete-property-button";
import { Button } from "@/components/ui/button";
import { deleteSellerPropertyAction } from "@/server/actions/properties";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function SellerListingActions({
  id,
  title,
  status,
  slug,
  returnTo,
}: {
  id: string;
  title: string;
  status: string;
  slug: string;
  returnTo: string;
}) {
  const editHref = `/seller/properties/${id}/edit?return=${encodeURIComponent(returnTo)}`;
  const publicHref = `/properties/${slug}`;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${publicHref}`);
      toast.success("Link copied");
    } catch {
      toast.error("Couldn't copy the link");
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {status === "draft" ? (
        <Button asChild size="sm" className="rounded-full">
          <Link href={editHref}>Edit Property</Link>
        </Button>
      ) : null}
      {status === "pending_review" ? (
        <Button asChild size="sm" className="rounded-full">
          <Link href={editHref}>View Details</Link>
        </Button>
      ) : null}
      {status === "published" ? (
        <Button asChild size="sm" className="rounded-full">
          <Link href={publicHref} target="_blank" rel="noreferrer">
            View Listing
          </Link>
        </Button>
      ) : null}
      {status === "rejected" ? (
        <Button asChild size="sm" className="rounded-full">
          <Link href={editHref}>View Feedback &amp; Fix</Link>
        </Button>
      ) : null}
      <DeletePropertyButton
        id={id}
        title={title}
        redirectTo={returnTo}
        remove={deleteSellerPropertyAction}
      />

      {status !== "draft" ? (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="sm" variant="outline" className="rounded-full" aria-label="More actions">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {status !== "draft" ? (
            <DropdownMenuItem asChild>
              <Link href={editHref}>{status === "rejected" ? "Edit & Fix Issues" : "Edit Property"}</Link>
            </DropdownMenuItem>
          ) : null}
          {status === "published" ? (
            <DropdownMenuItem onSelect={() => void copyLink()}>Copy Link</DropdownMenuItem>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>
      ) : null}
    </div>
  );
}
