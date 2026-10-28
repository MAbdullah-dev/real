import {
  ArrowLeft,
  Bath,
  Bed,
  Building2,
  ExternalLink,
  MapPin,
  Maximize2,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense, type ReactNode } from "react";

import { AdminPropertyGallery } from "@/components/admin/admin-property-gallery";
import { AdminPropertyReviewPanel } from "@/components/admin/admin-property-review-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPrice } from "@/lib/utils";
import { requireRole } from "@/server/auth";
import { getAdminProperty } from "@/server/admin";

export const metadata = { title: "Review property" };

const STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  pending_review: "Pending review",
  published: "Published",
  rejected: "Rejected",
};

function categoryLabel(value: string) {
  return value.replace(/-/g, " ").replace(/^\w/, (char) => char.toUpperCase());
}

async function PropertyDetail({ id }: { id: string }) {
  await requireRole(["ADMIN"]);
  const property = await getAdminProperty(id);
  if (!property) notFound();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 space-y-3">
          <Button asChild variant="ghost" size="sm" className="rounded-full px-0 text-muted-foreground">
            <Link href="/admin/properties">
              <ArrowLeft className="mr-1.5 h-4 w-4" aria-hidden />
              Back to Properties
            </Link>
          </Button>
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
              {property.title}
            </h1>
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant={
                  property.status === "published"
                    ? "default"
                    : property.status === "pending_review"
                      ? "accent"
                      : "secondary"
                }
              >
                {STATUS_LABEL[property.status] ?? property.status}
              </Badge>
              <Badge variant="outline" className="capitalize">
                {property.ownerKind === "unknown" ? "Unassigned" : property.ownerKind}
              </Badge>
              <span className="text-sm text-muted-foreground">{property.ownerName}</span>
            </div>
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
              {property.address}, {property.city}, {property.country}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {property.status === "published" ? (
            <Button asChild variant="outline" className="rounded-full">
              <Link href={`/properties/${property.slug}`} target="_blank" rel="noreferrer">
                Open public listing
                <ExternalLink className="ml-1.5 h-4 w-4" aria-hidden />
              </Link>
            </Button>
          ) : null}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(20rem,0.8fr)] xl:items-start">
        <div className="space-y-6">
          <AdminPropertyGallery title={property.title} images={property.images} />

          <section className="space-y-4 rounded-3xl border border-border/70 bg-card/70 p-5 sm:p-6">
            <div>
              <h2 className="text-base font-semibold tracking-tight sm:text-lg">Overview</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Listing facts from the submitted property record.
              </p>
            </div>
            <Separator />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Fact label="Price" value={formatPrice(property.price)} />
              <Fact
                label="Purpose"
                value={property.purpose === "rent" ? "For rent" : "For sale"}
              />
              <Fact
                label="Type"
                value={
                  property.categories.length
                    ? property.categories.map(categoryLabel).join(", ")
                    : "—"
                }
              />
              <Fact
                label="Bedrooms"
                value={String(property.bedrooms)}
                icon={<Bed className="h-3.5 w-3.5" aria-hidden />}
              />
              <Fact
                label="Bathrooms"
                value={String(property.bathrooms)}
                icon={<Bath className="h-3.5 w-3.5" aria-hidden />}
              />
              <Fact
                label="Area"
                value={`${property.areaSqm} m²`}
                icon={<Maximize2 className="h-3.5 w-3.5" aria-hidden />}
              />
              <Fact label="Furnished" value={property.furnished ? "Yes" : "No"} />
              <Fact label="Bookings" value={String(property._count.bookings)} />
              <Fact label="Enquiries" value={String(property._count.leads)} />
            </div>
          </section>

          <section className="space-y-4 rounded-3xl border border-border/70 bg-card/70 p-5 sm:p-6">
            <div>
              <h2 className="text-base font-semibold tracking-tight sm:text-lg">Description</h2>
            </div>
            <Separator />
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
              {property.description || "No description provided."}
            </p>
          </section>

          {property.amenities.length > 0 ? (
            <section className="space-y-4 rounded-3xl border border-border/70 bg-card/70 p-5 sm:p-6">
              <div>
                <h2 className="text-base font-semibold tracking-tight sm:text-lg">Amenities</h2>
              </div>
              <Separator />
              <ul className="flex flex-wrap gap-2">
                {property.amenities.map((item) => (
                  <li key={item}>
                    <Badge variant="secondary">{item}</Badge>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {property.badges.length > 0 ? (
            <section className="space-y-4 rounded-3xl border border-border/70 bg-card/70 p-5 sm:p-6">
              <div>
                <h2 className="text-base font-semibold tracking-tight sm:text-lg">
                  Marketing badges
                </h2>
              </div>
              <Separator />
              <ul className="flex flex-wrap gap-2">
                {property.badges.map((item) => (
                  <li key={item}>
                    <Badge variant="outline">{item}</Badge>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {property.videoUrl ? (
            <section className="space-y-3 rounded-3xl border border-border/70 bg-card/70 p-5 sm:p-6">
              <h2 className="text-base font-semibold tracking-tight sm:text-lg">Video</h2>
              <Separator />
              <a
                href={property.videoUrl}
                target="_blank"
                rel="noreferrer"
                className="break-all text-sm text-primary hover:underline"
              >
                {property.videoUrl}
              </a>
            </section>
          ) : null}

          {property.availabilityWindows.length > 0 ? (
            <section className="space-y-4 rounded-3xl border border-border/70 bg-card/70 p-5 sm:p-6">
              <div>
                <h2 className="text-base font-semibold tracking-tight sm:text-lg">
                  Viewing windows
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {property.availabilityWindows.length} window
                  {property.availabilityWindows.length === 1 ? "" : "s"} configured by the owner.
                </p>
              </div>
              <Separator />
              <ul className="space-y-2 text-sm">
                {property.availabilityWindows.map((window, index) => (
                  <li
                    key={`${window.start.toISOString()}-${index}`}
                    className="rounded-2xl border border-border/60 bg-muted/20 px-3 py-2"
                  >
                    <p className="font-medium">
                      {window.start.toLocaleString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}{" "}
                      –{" "}
                      {window.end.toLocaleString("en-US", {
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {window.durationMin} min viewings · {window.bufferMin} min buffer
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>

        <aside className="space-y-6 xl:sticky xl:top-24">
          <AdminPropertyReviewPanel id={property.id} status={property.status} />

          <section className="space-y-4 rounded-3xl border border-border/70 bg-card/70 p-5 sm:p-6">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" aria-hidden />
              <h2 className="text-base font-semibold tracking-tight">Owner</h2>
            </div>
            <Separator />
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-xs text-muted-foreground">Type</dt>
                <dd className="mt-0.5 font-medium capitalize">
                  {property.ownerKind === "unknown" ? "Unassigned" : property.ownerKind}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Name</dt>
                <dd className="mt-0.5 font-medium">{property.ownerName}</dd>
              </div>
              {property.ownerKind === "agency" && property.agency ? (
                <>
                  <div>
                    <dt className="text-xs text-muted-foreground">Agency status</dt>
                    <dd className="mt-0.5 capitalize">{property.agency.status.replaceAll("_", " ")}</dd>
                  </div>
                  {property.agency.phone ? (
                    <div>
                      <dt className="text-xs text-muted-foreground">Phone</dt>
                      <dd className="mt-0.5">{property.agency.phone}</dd>
                    </div>
                  ) : null}
                  {property.agency.city ? (
                    <div>
                      <dt className="text-xs text-muted-foreground">Agency city</dt>
                      <dd className="mt-0.5">{property.agency.city}</dd>
                    </div>
                  ) : null}
                </>
              ) : null}
              {property.ownerKind === "seller" && property.seller ? (
                <>
                  {property.seller.email ? (
                    <div>
                      <dt className="text-xs text-muted-foreground">Email</dt>
                      <dd className="mt-0.5 break-all">{property.seller.email}</dd>
                    </div>
                  ) : null}
                  {property.seller.sellerProfile?.phone ? (
                    <div>
                      <dt className="text-xs text-muted-foreground">Phone</dt>
                      <dd className="mt-0.5">{property.seller.sellerProfile.phone}</dd>
                    </div>
                  ) : null}
                  {property.seller.sellerProfile?.status ? (
                    <div>
                      <dt className="text-xs text-muted-foreground">Seller status</dt>
                      <dd className="mt-0.5 capitalize">
                        {property.seller.sellerProfile.status.replaceAll("_", " ")}
                      </dd>
                    </div>
                  ) : null}
                </>
              ) : null}
              <div>
                <dt className="text-xs text-muted-foreground">Listing contact</dt>
                <dd className="mt-0.5">
                  {property.agent.name ?? "—"}
                  {property.agent.email ? (
                    <span className="block text-muted-foreground">{property.agent.email}</span>
                  ) : null}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Updated</dt>
                <dd className="mt-0.5">
                  {property.updatedAt.toLocaleString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </dd>
              </div>
            </dl>
          </section>
        </aside>
      </div>
    </div>
  );
}

function Fact({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-muted/20 px-3 py-2.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 flex items-center gap-1.5 text-sm font-medium">
        {icon}
        {value}
      </p>
    </div>
  );
}

export default async function AdminPropertyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <Suspense fallback={<Skeleton className="h-[32rem] w-full rounded-3xl" />}>
      <PropertyDetail id={id} />
    </Suspense>
  );
}
