import type { PropertyPurpose } from "@/types";

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
};
