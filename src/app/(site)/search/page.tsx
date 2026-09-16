import { SearchX } from "lucide-react";
import { Suspense } from "react";

import { LayoutWide } from "@/components/layout/shell";
import { PropertyCard } from "@/components/property/property-card";
import { SearchExplorePanel } from "@/components/search/property-filters";
import { SortSelect } from "@/components/search/sort-select";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { PRICE_CEILING, parseSearchParams } from "@/server/property-filters";
import { filterProperties } from "@/server/properties";

export const metadata = { title: "Search properties" };

export default function SearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <LayoutWide className="py-10 sm:py-12 lg:py-14">
      <div className="max-w-2xl">
        <h1 className="text-3xl font-semibold tracking-tight">Search properties</h1>
        <p className="mt-2 text-muted-foreground">
          Search by place or keyword, then narrow by deal type, size, and budget.
        </p>
      </div>

      <Suspense fallback={<SearchResultsFallback />}>
        <SearchResults searchParams={searchParams} />
      </Suspense>
    </LayoutWide>
  );
}

async function SearchResults({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = parseSearchParams(await searchParams);

  const results = await filterProperties({
    ...params,
    // A full-range slider is not a filter, so don't narrow on it.
    minPrice: params.minPrice > 0 ? params.minPrice : undefined,
    maxPrice: params.maxPrice < PRICE_CEILING ? params.maxPrice : undefined,
  });

  return (
    <>
      <div className="mt-8 lg:mt-10">
        <SearchExplorePanel defaultQuery={params.q} />
      </div>

      <div className="mt-10 lg:mt-12">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold tabular-nums text-foreground">
              {results.length}
            </span>{" "}
            {results.length === 1 ? "property" : "properties"}
            {params.q ? (
              <>
                {" "}
                for <span className="font-medium text-foreground">{params.q}</span>
              </>
            ) : null}
          </p>
          {results.length > 1 ? <SortSelect value={params.sort} /> : null}
        </div>

        {results.length === 0 ? (
          <EmptyState
            className="mt-8"
            icon={SearchX}
            title="No properties match those filters"
            description="Try widening the price range, clearing the property type, or searching a nearby city."
            action={{ label: "Clear all filters", href: "/search" }}
          />
        ) : (
          <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {results.map((p, i) => (
              <PropertyCard key={p.id} property={p} index={i} layout="showcase" />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function SearchResultsFallback() {
  return (
    <div className="mt-8 space-y-10">
      <Skeleton className="h-24 w-full rounded-2xl" />
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="aspect-[4/5] w-full rounded-3xl" />
        ))}
      </div>
    </div>
  );
}
