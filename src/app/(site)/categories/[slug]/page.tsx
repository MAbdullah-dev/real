import { LayoutWide } from "@/components/layout/shell";
import { PropertyCard } from "@/components/property/property-card";
import { getPropertiesByCategory } from "@/data/properties";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

const LABELS: Record<string, string> = {
  apartment: "Apartments & lofts",
  villa: "Villas & compounds",
  home: "Homes",
  penthouse: "Penthouses",
  luxury: "Luxury collection",
  commercial: "Commercial",
  office: "Offices",
  shop: "Retail & shops",
  farmhouse: "Farmhouses",
  beach: "Beach houses",
  "short-stay": "Short stay",
  family: "Family homes",
  "new-project": "New projects",
  featured: "Featured listings",
  trending: "Trending destinations",
  "smart-home": "Smart homes",
  recommended: "Recommended for you",
};

export function generateStaticParams() {
  return Object.keys(LABELS).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const title = LABELS[slug];
  if (!title) return {};
  return { title, description: `Browse ${title.toLowerCase()} on Estate Elite.` };
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const title = LABELS[slug];
  if (!title) notFound();

  const properties = getPropertiesByCategory(slug);

  return (
    <LayoutWide className="py-12 sm:py-14 lg:py-16">
      <h1 className="text-3xl font-semibold tracking-tight capitalize">{title}</h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        A focused collection with premium cards, wishlist, and concierge-led visit requests.
      </p>
      <div className="mt-10 grid gap-8 sm:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3">
        {properties.map((p, i) => (
          <PropertyCard key={p.id} property={p} index={i} layout="showcase" />
        ))}
      </div>
    </LayoutWide>
  );
}
