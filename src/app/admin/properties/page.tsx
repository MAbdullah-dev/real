import { Building2, ExternalLink } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";

import { PropertyModerationControls } from "@/components/admin/moderation-controls";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn, formatPrice } from "@/lib/utils";
import {
  listAdminProperties,
  type AdminPropertyTab,
} from "@/server/admin";

const STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  pending_review: "Pending review",
  published: "Published",
  rejected: "Rejected",
};

const TABS: Array<{ id: AdminPropertyTab; label: string }> = [
  { id: "all", label: "All Properties" },
  { id: "pending", label: "Pending Review" },
  { id: "agency", label: "Agency Properties" },
  { id: "seller", label: "Seller Properties" },
];

type Search = {
  tab?: string;
  q?: string;
  status?: string;
  city?: string;
  page?: string;
};

function parseTab(value?: string): AdminPropertyTab {
  if (value === "pending" || value === "agency" || value === "seller") return value;
  return "all";
}

function parseStatus(value?: string) {
  if (
    value === "draft" ||
    value === "pending_review" ||
    value === "published" ||
    value === "rejected"
  ) {
    return value;
  }
  return "all" as const;
}

function hrefFor(params: {
  tab: AdminPropertyTab;
  q?: string;
  status?: string;
  city?: string;
  page?: number;
}) {
  const search = new URLSearchParams();
  if (params.tab !== "all") search.set("tab", params.tab);
  if (params.q?.trim()) search.set("q", params.q.trim());
  if (params.status && params.status !== "all") search.set("status", params.status);
  if (params.city && params.city !== "all") search.set("city", params.city);
  if (params.page && params.page > 1) search.set("page", String(params.page));
  const qs = search.toString();
  return qs ? `/admin/properties?${qs}` : "/admin/properties";
}

async function PropertiesInventory({ search }: { search: Search }) {
  const tab = parseTab(search.tab);
  const q = search.q?.trim() ?? "";
  const status = parseStatus(search.status);
  const city = search.city?.trim() || "all";
  const page = Math.max(1, Number(search.page) || 1);

  const data = await listAdminProperties({
    tab,
    q: q || undefined,
    status,
    city: city === "all" ? undefined : city,
    page,
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {TABS.map((item) => {
          const count = data.counts[item.id];
          const active = tab === item.id;
          return (
            <Button
              key={item.id}
              asChild
              size="sm"
              variant={active ? "default" : "outline"}
              className="rounded-full"
            >
              <Link
                href={hrefFor({ tab: item.id, q, status, city })}
                aria-current={active ? "page" : undefined}
              >
                {item.label}
                <span
                  className={cn(
                    "ml-1.5 tabular-nums",
                    active ? "text-primary-foreground/80" : "text-muted-foreground"
                  )}
                >
                  {count}
                </span>
              </Link>
            </Button>
          );
        })}
      </div>

      <form className="flex flex-col gap-3 rounded-3xl border border-border/70 bg-card/60 p-4 sm:flex-row sm:flex-wrap sm:items-end">
        <input type="hidden" name="tab" value={tab} />
            <div className="min-w-48 flex-1 space-y-1.5">
          <label htmlFor="admin-property-q" className="text-xs font-medium text-muted-foreground">
            Search
          </label>
          <Input
            id="admin-property-q"
            name="q"
            defaultValue={q}
            placeholder="Title, city, owner…"
            className="rounded-full"
          />
        </div>
        {tab !== "pending" ? (
          <div className="w-full space-y-1.5 sm:w-44">
            <label htmlFor="admin-property-status" className="text-xs font-medium text-muted-foreground">
              Status
            </label>
            <select
              id="admin-property-status"
              name="status"
              defaultValue={status}
              className="flex h-11 w-full rounded-full border border-input bg-background/80 px-4 text-sm"
            >
              <option value="all">All statuses</option>
              <option value="draft">Draft</option>
              <option value="pending_review">Pending review</option>
              <option value="published">Published</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        ) : null}
        <div className="w-full space-y-1.5 sm:w-44">
          <label htmlFor="admin-property-city" className="text-xs font-medium text-muted-foreground">
            City
          </label>
          <select
            id="admin-property-city"
            name="city"
            defaultValue={city}
            className="flex h-11 w-full rounded-full border border-input bg-background/80 px-4 text-sm"
          >
            <option value="all">All cities</option>
            {data.cities.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>
        <Button type="submit" className="rounded-full">
          Apply filters
        </Button>
      </form>

      <p className="text-sm text-muted-foreground">
        Showing {data.items.length} of {data.total} listing{data.total === 1 ? "" : "s"}
        {tab === "pending" ? " awaiting review" : ""}
        {data.pageCount > 1 ? ` · page ${data.page} of ${data.pageCount}` : ""}
      </p>

      {data.items.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No properties match"
          description={
            tab === "pending"
              ? "Nothing is waiting for platform review right now."
              : "Try another tab or clear the search filters."
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-3xl border border-border/70">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Property</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Location</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="flex min-w-56 items-center gap-3">
                      <div className="relative h-12 w-16 shrink-0 overflow-hidden rounded-xl bg-muted">
                        {item.image ? (
                          <Image
                            src={item.image}
                            alt=""
                            fill
                            className="object-cover"
                            sizes="64px"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-muted-foreground">
                            <Building2 className="h-4 w-4" aria-hidden />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-medium">{item.title}</p>
                        {item.status === "published" ? (
                          <Link
                            href={`/properties/${item.slug}`}
                            className="mt-0.5 inline-flex items-center gap-1 text-xs text-primary hover:underline"
                          >
                            View public page
                            <ExternalLink className="h-3 w-3" aria-hidden />
                          </Link>
                        ) : (
                          <p className="mt-0.5 text-xs text-muted-foreground">Not public yet</p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <Badge variant="secondary" className="capitalize">
                        {item.ownerKind === "unknown" ? "Unassigned" : item.ownerKind}
                      </Badge>
                      <p className="text-sm text-muted-foreground">{item.ownerName}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm">{item.city}</p>
                    <p className="text-xs text-muted-foreground">{item.country}</p>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatPrice(item.price)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        item.status === "published"
                          ? "default"
                          : item.status === "pending_review"
                            ? "accent"
                            : "secondary"
                      }
                    >
                      {STATUS_LABEL[item.status] ?? item.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      <Button asChild size="sm" variant="outline" className="rounded-full">
                        <Link href={`/admin/properties/${item.id}`}>View</Link>
                      </Button>
                      <PropertyModerationControls id={item.id} status={item.status} />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {data.pageCount > 1 ? (
        <div className="flex items-center justify-between gap-3">
          {data.page <= 1 ? (
            <Button variant="outline" size="sm" className="rounded-full" disabled>
              Previous
            </Button>
          ) : (
            <Button asChild variant="outline" size="sm" className="rounded-full">
              <Link href={hrefFor({ tab, q, status, city, page: data.page - 1 })}>Previous</Link>
            </Button>
          )}
          <p className="text-sm text-muted-foreground tabular-nums">
            Page {data.page} / {data.pageCount}
          </p>
          {data.page >= data.pageCount ? (
            <Button variant="outline" size="sm" className="rounded-full" disabled>
              Next
            </Button>
          ) : (
            <Button asChild variant="outline" size="sm" className="rounded-full">
              <Link href={hrefFor({ tab, q, status, city, page: data.page + 1 })}>Next</Link>
            </Button>
          )}
        </div>
      ) : null}
    </div>
  );
}

export default async function AdminPropertiesPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const search = await searchParams;
  const suspenseKey = [
    search.tab ?? "all",
    search.q ?? "",
    search.status ?? "all",
    search.city ?? "all",
    search.page ?? "1",
  ].join("|");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Properties</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Browse every agency and seller listing, then publish, unpublish, or reject when review is
          needed.
        </p>
      </div>
      <Suspense key={suspenseKey} fallback={<Skeleton className="h-96 w-full rounded-3xl" />}>
        <PropertiesInventory search={search} />
      </Suspense>
    </div>
  );
}
