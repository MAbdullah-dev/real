import { LayoutWide } from "@/components/layout/shell";
import { PropertyGallery } from "@/components/property/property-gallery";
import { PropertyMap } from "@/components/property/property-map";
import { MortgageCalculator } from "@/components/property/mortgage-calculator";
import { PropertyStickyPanel } from "@/components/property/property-sticky-panel";
import { PropertyCard } from "@/components/property/property-card";
import { PropertyViewTracker } from "@/components/property/property-view-tracker";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  getPropertyBySlug,
  getSimilarProperties,
  listPublishedPropertyParams,
} from "@/server/properties";
import { formatPrice } from "@/lib/utils";
import { Bath, Bed, MapPin, Maximize2, Sofa, Star } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const properties = await listPublishedPropertyParams();
  return properties.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const p = await getPropertyBySlug(slug);
  if (!p) return { title: "Property" };
  return {
    title: p.title,
    description: p.description.slice(0, 160),
  };
}

export default async function PropertyDetailPage({ params }: Props) {
  const { slug } = await params;
  const property = await getPropertyBySlug(slug);
  if (!property) notFound();

  const gallery = [property.image, ...property.gallery];
  const similar = await getSimilarProperties(property);

  const amenityIcons: Record<string, typeof Bed> = {
    default: Sofa,
  };

  return (
    <>
      <Suspense fallback={null}>
        <PropertyViewTracker propertyId={property.id} />
      </Suspense>
      <div className="w-full px-[var(--section-x)] pt-8 sm:pt-10 lg:pt-12">
        <div className="mx-auto max-w-[var(--page-cinematic)]">
          <PropertyGallery images={gallery} title={property.title} />
        </div>
      </div>

      <LayoutWide className="py-10 sm:py-12 lg:py-14">
      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <Link href="/search" className="hover:text-foreground">
          Search
        </Link>
        <span>/</span>
        <Link href={`/categories/${property.categories[0]}`} className="hover:text-foreground capitalize">
          {property.categories[0]?.replaceAll("-", " ")}
        </Link>
        <span>/</span>
        <span className="text-foreground">{property.title}</span>
      </div>

      <div className="mt-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex flex-wrap gap-2">
            {property.badges?.map((b) => (
              <Badge key={b} variant="accent">
                {b}
              </Badge>
            ))}
            <Badge variant="secondary" className="capitalize">
              {property.purpose === "rent" ? "Lease" : "Sale"}
            </Badge>
          </div>
          <h1 className="mt-4 text-balance text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl lg:leading-[1.08]">
            {property.title}
          </h1>
          <p className="mt-3 flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-4 w-4 shrink-0" />
            {property.address}, {property.city}, {property.country}
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
            {property.reviewCount > 0 ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1">
                <Star className="h-4 w-4 text-accent" aria-hidden />
                {property.rating.toFixed(2)} ({property.reviewCount} reviews)
              </span>
            ) : null}
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1">
              <Bed className="h-4 w-4" />
              {property.bedrooms} beds
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1">
              <Bath className="h-4 w-4" />
              {property.bathrooms} baths
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1">
              <Maximize2 className="h-4 w-4" />
              {property.areaSqm} m²
            </span>
          </div>
        </div>
        <div className="text-left lg:text-right">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {property.purpose === "rent" ? "Monthly" : "Asking"}
          </p>
          <p className="text-3xl font-semibold tabular-nums">
            {property.purpose === "rent"
              ? `${formatPrice(property.price)}/mo`
              : formatPrice(property.price)}
          </p>
          <Link
            href={`/booking/${property.id}`}
            className="mt-3 inline-block text-sm font-medium text-primary hover:underline"
          >
            Request a viewing →
          </Link>
        </div>
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_400px] xl:gap-14 lg:items-start">
        <div className="min-w-0 space-y-10">
          {property.videoUrl ? (
            <Card className="overflow-hidden rounded-3xl">
              <CardContent className="p-0">
                <div className="aspect-video w-full">
                  <iframe
                    src={property.videoUrl}
                    title={`Video tour of ${property.title}`}
                    className="h-full w-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </CardContent>
            </Card>
          ) : null}

          <Tabs defaultValue="overview">
            <TabsList className="w-full justify-start overflow-x-auto">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="amenities">Amenities</TabsTrigger>
              <TabsTrigger value="location">Location</TabsTrigger>
            </TabsList>
            <TabsContent value="overview" className="mt-6 space-y-6">
              <p className="whitespace-pre-line leading-relaxed text-muted-foreground">
                {property.description}
              </p>
              <dl className="grid gap-3 sm:grid-cols-2">
                {[
                  { label: "Purpose", value: property.purpose === "rent" ? "For rent" : "For sale" },
                  { label: "Bedrooms", value: String(property.bedrooms) },
                  { label: "Bathrooms", value: String(property.bathrooms) },
                  { label: "Built-up area", value: `${property.areaSqm} m²` },
                  { label: "Furnishing", value: property.furnished ? "Furnished" : "Unfurnished" },
                  {
                    label: property.purpose === "rent" ? "Monthly rent" : "Price per m²",
                    value:
                      property.purpose === "rent"
                        ? `${formatPrice(property.price)}/mo`
                        : formatPrice(Math.round(property.price / Math.max(1, property.areaSqm))),
                  },
                ].map((row) => (
                  <div
                    key={row.label}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card px-4 py-3 text-sm"
                  >
                    <dt className="text-muted-foreground">{row.label}</dt>
                    <dd className="font-medium">{row.value}</dd>
                  </div>
                ))}
              </dl>
            </TabsContent>
            <TabsContent value="amenities" className="mt-6">
              {property.amenities.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  The listing contact has not added an amenity list — ask them in the enquiry
                  form.
                </p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {property.amenities.map((a) => {
                    const Icon = amenityIcons[a.toLowerCase()] ?? amenityIcons.default;
                    return (
                      <div
                        key={a}
                        className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3"
                      >
                        <Icon className="h-5 w-5 text-primary" aria-hidden />
                        <span className="text-sm">{a}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </TabsContent>
            <TabsContent value="location" className="mt-6 space-y-4">
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 shrink-0" aria-hidden />
                {property.address}, {property.city}, {property.country}
              </p>
              {property.coordinates ? (
                <PropertyMap
                  lat={property.coordinates.lat}
                  lng={property.coordinates.lng}
                  title={property.title}
                />
              ) : (
                <p className="rounded-2xl border border-dashed border-border bg-muted/20 px-4 py-6 text-sm text-muted-foreground">
                  Exact coordinates are not published for this listing. The listing contact
                  shares the meeting point when a viewing is confirmed.
                </p>
              )}
            </TabsContent>
          </Tabs>

          {property.purpose === "sale" ? <MortgageCalculator homePrice={property.price} /> : null}

          {similar.length > 0 ? (
            <div>
              <h2 className="text-xl font-semibold">Similar properties</h2>
              <div className="mt-6 grid gap-8 md:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3">
                {similar.map((p, i) => (
                  <PropertyCard key={p.id} property={p} index={i} layout="showcase" />
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <PropertyStickyPanel property={property} />
      </div>
      </LayoutWide>
    </>
  );
}
