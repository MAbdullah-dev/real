import { LayoutWide } from "@/components/layout/shell";
import { PropertyCard } from "@/components/property/property-card";
import { SearchExplorePanel } from "@/components/search/property-filters";
import { filterProperties } from "@/data/properties";
import type { PropertyPurpose } from "@/types";

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
          Use the discovery panel below — keyword search and refinements live together for a quicker brief-to-results
          loop.
        </p>
      </div>

      <div className="mt-8 lg:mt-10">
        <SearchExplorePanel defaultQuery={q} />
      </div>

      <div className="mt-10 lg:mt-12">
        <div className="flex items-end justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground tabular-nums">{results.length}</span> curated{" "}
            {results.length === 1 ? "match" : "matches"}
          </p>
        </div>
        <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {results.map((p, i) => (
            <PropertyCard key={p.id} property={p} index={i} layout="showcase" />
          ))}
        </div>
        {results.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-dashed border-border bg-muted/20 px-6 py-12 text-center">
            <p className="text-sm text-muted-foreground">
              No homes match yet — loosen the price range or switch purpose to see more inventory.
            </p>
          </div>
        ) : null}
      </div>
    </LayoutWide>
  );
}
