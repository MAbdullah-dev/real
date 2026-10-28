import { Building2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";

import { SellerListingActions } from "@/components/seller/seller-listing-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, formatPrice } from "@/lib/utils";
import type { ReviewKind } from "@/server/property-review";
import { listSellerProperties } from "@/server/properties";
import { requireSeller } from "@/server/seller";

const PAGE_SIZE = 12;

const STATUS_LABEL = {
  draft: "Draft",
  pending_review: "Pending Review",
  published: "Published",
  rejected: "Changes Required",
} as const;

const REVIEW_TITLE: Record<ReviewKind, string> = {
  approved: "Approved & Published",
  rejected: "Changes Requested",
  unpublished: "Temporarily unpublished",
  resubmitted: "Resubmitted for Review",
};

const STATUS_VARIANT = {
  draft: "secondary",
  pending_review: "accent",
  published: "default",
  rejected: "destructive",
} as const;

type StatusFilter = "all" | keyof typeof STATUS_LABEL;
type SortKey = "updated" | "newest" | "oldest" | "price-asc" | "price-desc";

function categoryLabel(value: string) {
  return value.replace(/-/g, " ").replace(/^\w/, (char) => char.toUpperCase());
}

function formatWhen(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function parseStatus(value: string | undefined): StatusFilter {
  if (value && value in STATUS_LABEL) return value as StatusFilter;
  return "all";
}

function parseSort(value: string | undefined): SortKey {
  if (value === "newest" || value === "oldest" || value === "price-asc" || value === "price-desc") return value;
  return "updated";
}

function listingHref(query: { status?: string; q?: string; sort?: string; page?: number }) {
  const params = new URLSearchParams();
  if (query.status && query.status !== "all") params.set("status", query.status);
  if (query.q) params.set("q", query.q);
  if (query.sort && query.sort !== "updated") params.set("sort", query.sort);
  if (query.page && query.page > 1) params.set("page", String(query.page));
  const search = params.toString();
  return search ? `/seller/properties?${search}` : "/seller/properties";
}

async function SellerListings({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; sort?: string; page?: string }>;
}) {
  const search = await searchParams;
  const status = parseStatus(search.status);
  const q = search.q?.trim() ?? "";
  const sort = parseSort(search.sort);
  const page = Math.max(1, Number(search.page) || 1);
  const { session } = await requireSeller();
  const listings = await listSellerProperties(session.user.id);
  const counts = {
    all: listings.length,
    published: listings.filter((row) => row.status === "published").length,
    pending_review: listings.filter((row) => row.status === "pending_review").length,
    rejected: listings.filter((row) => row.status === "rejected").length,
    draft: listings.filter((row) => row.status === "draft").length,
  };
  const needle = q.trim().toLowerCase();
  const filtered = listings.filter((row) => {
    if (status !== "all" && row.status !== status) return false;
    if (!needle) return true;
    const haystack = [row.property.title, row.property.city, row.property.address, row.property.country]
      .join(" ")
      .toLowerCase();
    return haystack.includes(needle);
  });
  const sorted = [...filtered].sort((a, b) => {
    if (sort === "newest") return b.createdAt.getTime() - a.createdAt.getTime();
    if (sort === "oldest") return a.createdAt.getTime() - b.createdAt.getTime();
    if (sort === "price-asc") return a.property.price - b.property.price;
    if (sort === "price-desc") return b.property.price - a.property.price;
    return b.updatedAt.getTime() - a.updatedAt.getTime();
  });
  const pageCount = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const visible = sorted.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const returnTo = listingHref({ status, q, sort, page: currentPage });
  const filtersActive = status !== "all" || q.length > 0 || sort !== "updated";
  const cards = [
    { id: "all" as const, label: "All Listings", count: counts.all },
    { id: "published" as const, label: "Published", count: counts.published },
    { id: "pending_review" as const, label: "Pending Review", count: counts.pending_review },
    { id: "rejected" as const, label: "Changes Required", count: counts.rejected },
    { id: "draft" as const, label: "Drafts", count: counts.draft },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {cards.map((card) => {
          const active = status === card.id;
          return (
            <Link
              key={card.id}
              href={listingHref({ status: card.id, q, sort })}
              aria-current={active ? "page" : undefined}
              className={cn(
                "rounded-3xl border border-border/70 bg-card/70 p-4 transition-colors hover:bg-muted/40",
                active && "border-primary"
              )}
            >
              <p className="text-sm text-muted-foreground">{card.label}</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums">{card.count}</p>
            </Link>
          );
        })}
      </div>

      <form action="/seller/properties" className="grid gap-3 rounded-3xl border border-border/70 bg-card/70 p-4 sm:grid-cols-2 lg:grid-cols-[1fr_12rem_14rem_auto]">
        <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
          <label htmlFor="listing-search" className="text-xs text-muted-foreground">
            Search
          </label>
          <Input id="listing-search" name="q" defaultValue={q} placeholder="Title or location" />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="listing-status" className="text-xs text-muted-foreground">
            Status
          </label>
          <select
            id="listing-status"
            name="status"
            defaultValue={status}
            className="flex h-11 w-full rounded-full border border-input bg-background/80 px-4 text-sm"
          >
            <option value="all">All statuses</option>
            <option value="published">Published</option>
            <option value="pending_review">Pending Review</option>
            <option value="rejected">Changes Required</option>
            <option value="draft">Draft</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <label htmlFor="listing-sort" className="text-xs text-muted-foreground">
            Sort
          </label>
          <select
            id="listing-sort"
            name="sort"
            defaultValue={sort}
            className="flex h-11 w-full rounded-full border border-input bg-background/80 px-4 text-sm"
          >
            <option value="updated">Recently updated</option>
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="price-asc">Price: low to high</option>
            <option value="price-desc">Price: high to low</option>
          </select>
        </div>
        <div className="flex items-end gap-2">
          <Button type="submit" className="rounded-full">
            Apply
          </Button>
          {filtersActive ? (
            <Button asChild type="button" variant="outline" className="rounded-full">
              <Link href="/seller/properties">Clear Filters</Link>
            </Button>
          ) : null}
        </div>
      </form>

      {listings.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="Your property journey starts here"
          description="Add your first property to start managing your listings in one place."
          action={{ label: "Add New Property", href: "/seller/properties/new" }}
        />
      ) : sorted.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border px-6 py-16 text-center">
          <p className="text-sm text-muted-foreground">No properties match your current filters.</p>
          <Button asChild className="mt-6 rounded-full" variant="outline">
            <Link href="/seller/properties">Clear Filters</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Showing {visible.length} of {sorted.length}{" "}
            {sorted.length === 1 ? "listing" : "listings"}
          </p>
          <ul className="space-y-3">
            {visible.map((row) => {
              const label = STATUS_LABEL[row.status as keyof typeof STATUS_LABEL] ?? row.status;
              const type = row.property.categories[0] ? categoryLabel(row.property.categories[0]) : "Property";
              const review = row.latestReview;
              return (
                <li key={row.property.id} className="rounded-3xl border border-border/70 bg-card/70 p-4 sm:p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                    <div className="relative h-24 w-full shrink-0 overflow-hidden rounded-2xl bg-muted sm:h-20 sm:w-28">
                      {row.property.image ? (
                        <Image
                          src={row.property.image}
                          alt=""
                          fill
                          className="object-cover"
                          sizes="112px"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-muted-foreground">
                          <Building2 className="h-5 w-5" aria-hidden />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <Link
                            href={`/seller/properties/${row.property.id}/edit?return=${encodeURIComponent(returnTo)}`}
                            className="font-medium hover:underline"
                          >
                            {row.property.title}
                          </Link>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {row.property.city}, {row.property.country} · {type}
                          </p>
                          <p className="mt-1 text-sm font-medium">{formatPrice(row.property.price)}</p>
                        </div>
                        <Badge variant={STATUS_VARIANT[row.status as keyof typeof STATUS_VARIANT] ?? "secondary"}>
                          {label}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Updated {formatWhen(row.updatedAt)}
                        {review ? (
                          <>
                            {" "}
                            · Last review: {REVIEW_TITLE[review.action as ReviewKind] ?? review.action} ·{" "}
                            {formatWhen(review.createdAt)}
                          </>
                        ) : (
                          " · No review activity yet"
                        )}
                      </p>
                      {row.status === "pending_review" ? (
                        <p className="text-sm text-muted-foreground">Waiting for admin review.</p>
                      ) : null}
                      <SellerListingActions
                        id={row.property.id}
                        title={row.property.title}
                        status={row.status}
                        slug={row.property.slug}
                        returnTo={returnTo}
                      />
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
          {pageCount > 1 ? (
            <div className="flex items-center justify-between gap-3">
              {currentPage <= 1 ? (
                <Button variant="outline" size="sm" className="rounded-full" disabled>
                  Previous
                </Button>
              ) : (
                <Button asChild variant="outline" size="sm" className="rounded-full">
                  <Link href={listingHref({ status, q, sort, page: currentPage - 1 })}>Previous</Link>
                </Button>
              )}
              <p className="text-sm text-muted-foreground tabular-nums">
                Page {currentPage} / {pageCount}
              </p>
              {currentPage >= pageCount ? (
                <Button variant="outline" size="sm" className="rounded-full" disabled>
                  Next
                </Button>
              ) : (
                <Button asChild variant="outline" size="sm" className="rounded-full">
                  <Link href={listingHref({ status, q, sort, page: currentPage + 1 })}>Next</Link>
                </Button>
              )}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

export default function SellerPropertiesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; sort?: string; page?: string }>;
}) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">My Listings</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Manage your properties, track review progress, and keep your listings up to date.
          </p>
        </div>
        <Button asChild className="rounded-full">
          <Link href="/seller/properties/new">Add New Property</Link>
        </Button>
      </div>
      <Suspense fallback={<Skeleton className="h-96 w-full rounded-3xl" />}>
        <SellerListings searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
