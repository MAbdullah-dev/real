import { LayoutWide } from "@/components/layout/shell";
import { PropertyGallery } from "@/components/property/property-gallery";
import { MortgageCalculator } from "@/components/property/mortgage-calculator";
import { PropertyStickyPanel } from "@/components/property/property-sticky-panel";
import { PropertyCard } from "@/components/property/property-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MOCK_PROPERTIES, getPropertyBySlug } from "@/data/properties";
import { formatPrice } from "@/lib/utils";
import {
  Bath,
  Bed,
  Box,
  MapPin,
  Maximize2,
  ScanLine,
  Sofa,
  Star,
  Video,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const p = getPropertyBySlug(slug);
  if (!p) return { title: "Property" };
  return {
    title: p.title,
    description: p.description.slice(0, 160),
  };
}

export default async function PropertyDetailPage({ params }: Props) {
  const { slug } = await params;
  const property = getPropertyBySlug(slug);
  if (!property) notFound();

  const gallery = [property.image, ...property.gallery];
  const similar = MOCK_PROPERTIES.filter(
    (p) => p.id !== property.id && p.categories.some((c) => property.categories.includes(c))
  ).slice(0, 3);

  const amenityIcons: Record<string, typeof Bed> = {
    default: Sofa,
  };

  return (
    <>
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
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1">
              <Star className="h-4 w-4 text-accent" />
              {property.rating.toFixed(2)} ({property.reviewCount} reviews)
            </span>
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
          <Link href={`/booking/${property.id}`} className="mt-3 inline-block text-sm font-medium text-primary hover:underline">
            Open structured booking flow →
          </Link>
        </div>
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_400px] xl:gap-14 lg:items-start">
        <div className="min-w-0 space-y-10">
          <div className="grid gap-4 sm:grid-cols-3">
            <Card className="rounded-3xl border-dashed">
              <CardContent className="flex flex-col gap-2 p-6">
                <Video className="h-6 w-6 text-primary" />
                <p className="font-medium">Video tour</p>
                <p className="text-xs text-muted-foreground">Cinematic walkthrough — production-ready placeholder.</p>
                <p className="mt-auto text-sm font-medium text-primary">Preview on request</p>
              </CardContent>
            </Card>
            <Card className="rounded-3xl border-dashed">
              <CardContent className="flex flex-col gap-2 p-6">
                <ScanLine className="h-6 w-6 text-primary" />
                <p className="font-medium">360° preview</p>
                <p className="text-xs text-muted-foreground">Spatial mesh viewer — upgrade path to WebXR.</p>
                <p className="mt-auto text-sm font-medium text-primary">Spatial viewer · beta</p>
              </CardContent>
            </Card>
            <Card className="rounded-3xl border-dashed">
              <CardContent className="flex flex-col gap-2 p-6">
                <Box className="h-6 w-6 text-primary" />
                <p className="font-medium">AR staging</p>
                <p className="text-xs text-muted-foreground">Place finishes in-room — experimental SDK slot.</p>
                <p className="mt-auto text-sm font-medium text-primary">SDK integration slot</p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="overview">
            <TabsList className="w-full justify-start overflow-x-auto">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="amenities">Amenities</TabsTrigger>
              <TabsTrigger value="floor">Floor plans</TabsTrigger>
              <TabsTrigger value="reviews">Reviews</TabsTrigger>
            </TabsList>
            <TabsContent value="overview" className="mt-6 space-y-4">
              <p className="leading-relaxed text-muted-foreground">{property.description}</p>
              <div className="rounded-3xl border border-border bg-muted/30 p-6">
                <p className="text-sm font-semibold">Map integration</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Embed Mapbox / Google Maps with `{property.city}` centroid — placeholder for API keys.
                </p>
                <div className="mt-4 aspect-[21/9] rounded-2xl bg-gradient-to-br from-primary/15 to-accent/10" />
              </div>
              <div>
                <p className="text-sm font-semibold">Nearby</p>
                <ul className="mt-3 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                  <li>Waterfront promenade · 6 min walk</li>
                  <li>Private members club · 12 min drive</li>
                  <li>International school hub · 9 min drive</li>
                  <li>Signature dining row · 4 min walk</li>
                </ul>
              </div>
            </TabsContent>
            <TabsContent value="amenities" className="mt-6">
              <div className="grid gap-3 sm:grid-cols-2">
                {property.amenities.map((a) => {
                  const Icon = amenityIcons[a.toLowerCase()] ?? amenityIcons.default;
                  return (
                    <div
                      key={a}
                      className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3"
                    >
                      <Icon className="h-5 w-5 text-primary" />
                      <span className="text-sm">{a}</span>
                    </div>
                  );
                })}
              </div>
            </TabsContent>
            <TabsContent value="floor" className="mt-6">
              <Card className="rounded-3xl">
                <CardContent className="p-8">
                  <p className="text-sm text-muted-foreground">
                    Vector floor plans with unit overlays — upload PDF or CAD in the agent console.
                  </p>
                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    <div className="aspect-[4/3] rounded-2xl bg-muted" />
                    <div className="aspect-[4/3] rounded-2xl bg-muted" />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="reviews" className="mt-6 space-y-4">
              {[1, 2].map((i) => (
                <Card key={i} className="rounded-2xl">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Star className="h-4 w-4 text-accent" />5.0
                    </div>
                    <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                      “Impeccable communication, the visit felt orchestrated down to parking and elevator timing.”
                    </p>
                    <p className="mt-4 text-xs text-muted-foreground">Verified buyer · {property.city}</p>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          </Tabs>

          {property.purpose === "sale" ? <MortgageCalculator homePrice={property.price} /> : null}

          <div>
            <h2 className="text-xl font-semibold">Similar properties</h2>
            <div className="mt-6 grid gap-8 md:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3">
              {similar.map((p, i) => (
                <PropertyCard key={p.id} property={p} index={i} layout="showcase" />
              ))}
            </div>
          </div>
        </div>

        <PropertyStickyPanel property={property} />
      </div>
      </LayoutWide>
    </>
  );
}
