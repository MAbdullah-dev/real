import { LayoutWide } from "@/components/layout/shell";
import { PropertyCard } from "@/components/property/property-card";
import { PropertyFilters } from "@/components/search/property-filters";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { filterProperties } from "@/data/properties";
import type { PropertyPurpose } from "@/types";
import { Search } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : "";
  const purpose = (typeof sp.purpose === "string" ? sp.purpose : "all") as PropertyPurpose | "all";
  const type = typeof sp.type === "string" ? sp.type : "all";
  const bedrooms = typeof sp.bedrooms === "string" ? Number(sp.bedrooms) : 0;
  const bathrooms = typeof sp.bathrooms === "string" ? Number(sp.bathrooms) : 0;
  const furnished = (typeof sp.furnished === "string" ? sp.furnished : "all") as "all" | "yes" | "no";
  const minPrice = typeof sp.minPrice === "string" ? Number(sp.minPrice) : undefined;
  const maxPrice = typeof sp.maxPrice === "string" ? Number(sp.maxPrice) : undefined;

  const results = filterProperties({
    q,
    purpose,
    type,
    bedrooms: Number.isFinite(bedrooms) ? bedrooms : 0,
    bathrooms: Number.isFinite(bathrooms) ? bathrooms : 0,
    furnished,
    minPrice,
    maxPrice,
  });

  return (
    <LayoutWide className="py-10 sm:py-12 lg:py-14">
      <div className="max-w-2xl">
        <h1 className="text-3xl font-semibold tracking-tight">Search properties</h1>
        <p className="mt-2 text-muted-foreground">
          Refine by purpose, typology, and price — desktop filters stay pinned; mobile opens a bottom sheet.
        </p>
      </div>

      <form className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center" action="/search" method="get">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input name="q" defaultValue={q} placeholder="Search city, address, or keyword" className="h-12 pl-11" />
        </div>
        <Button type="submit" className="h-12 rounded-full sm:min-w-[120px] gap-2">
          <Search className="h-4 w-4" />
          Search
        </Button>
      </form>

      <div className="mt-10 grid gap-10 lg:grid-cols-[300px_minmax(0,1fr)] lg:items-start xl:gap-14">
        <PropertyFilters />
        <div>
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{results.length}</span> curated matches
          </p>
          <div className="mt-6 grid gap-8 sm:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3">
            {results.map((p, i) => (
              <PropertyCard key={p.id} property={p} index={i} layout="showcase" />
            ))}
          </div>
          {results.length === 0 ? (
            <p className="mt-10 text-sm text-muted-foreground">
              No homes match yet — loosen price or switch purpose to see more inventory.
            </p>
          ) : null}
        </div>
      </div>
    </LayoutWide>
  );
}
