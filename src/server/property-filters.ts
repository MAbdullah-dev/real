import { z } from "zod";

import type { PropertyPurpose } from "@/types";

export const PROPERTY_SORTS = {
  recommended: "Recommended",
  newest: "Newest first",
  "price-asc": "Price: low to high",
  "price-desc": "Price: high to low",
  "area-desc": "Largest first",
} as const;

export type PropertySort = keyof typeof PROPERTY_SORTS;

export type PropertyFilterParams = {
  q?: string;
  purpose?: PropertyPurpose | "all";
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  bathrooms?: number;
  minArea?: number;
  type?: string;
  furnished?: "all" | "yes" | "no";
  sort?: PropertySort;
};

export const PRICE_CEILING = 12_000_000;

const positiveInt = z.coerce.number().int().min(0).catch(0);

/**
 * URL params are user input: coerce, clamp, and fall back rather than passing
 * `NaN` or a hostile string into the query.
 */
export const searchParamsSchema = z.object({
  q: z.string().trim().max(120).catch(""),
  purpose: z.enum(["all", "sale", "rent"]).catch("all"),
  type: z.string().trim().max(40).catch("all"),
  bedrooms: positiveInt.pipe(z.number().max(20)).catch(0),
  bathrooms: positiveInt.pipe(z.number().max(20)).catch(0),
  furnished: z.enum(["all", "yes", "no"]).catch("all"),
  minPrice: positiveInt.pipe(z.number().max(PRICE_CEILING)).catch(0),
  maxPrice: z.coerce
    .number()
    .int()
    .min(0)
    .max(PRICE_CEILING)
    .catch(PRICE_CEILING),
  sort: z
    .enum(Object.keys(PROPERTY_SORTS) as [PropertySort, ...PropertySort[]])
    .catch("recommended"),
});

export function parseSearchParams(raw: Record<string, string | string[] | undefined>) {
  const flat = Object.fromEntries(
    Object.entries(raw).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value])
  );
  const parsed = searchParamsSchema.parse(flat);

  // A reversed range would silently return nothing; swap instead.
  const [minPrice, maxPrice] =
    parsed.minPrice > parsed.maxPrice
      ? [parsed.maxPrice, parsed.minPrice]
      : [parsed.minPrice, parsed.maxPrice];

  return { ...parsed, minPrice, maxPrice };
}
