import { z } from "zod";

export const PROPERTY_CATEGORIES = [
  "apartment",
  "villa",
  "home",
  "penthouse",
  "luxury",
  "commercial",
  "office",
  "shop",
  "farmhouse",
  "beach",
  "short-stay",
  "family",
  "new-project",
  "featured",
  "trending",
  "smart-home",
] as const;

const csv = z
  .string()
  .optional()
  .transform((value) =>
    (value ?? "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
  );

export const propertyInputSchema = z.object({
  title: z.string().min(4, "Title needs at least 4 characters."),
  description: z.string().min(20, "Description needs at least 20 characters."),
  address: z.string().min(4, "Enter a street address."),
  city: z.string().min(2, "Enter a city."),
  country: z.string().min(2, "Enter a country."),
  price: z.coerce.number().int().positive("Price must be greater than zero."),
  purpose: z.enum(["sale", "rent"]),
  bedrooms: z.coerce.number().int().min(0).max(50),
  bathrooms: z.coerce.number().int().min(0).max(50),
  areaSqm: z.coerce.number().int().positive("Area must be greater than zero."),
  furnished: z.coerce.boolean().default(false),
  videoUrl: z
    .string()
    .trim()
    .url("Enter a valid video URL.")
    .optional()
    .or(z.literal("").transform(() => undefined)),
  categories: z.array(z.enum(PROPERTY_CATEGORIES)).min(1, "Pick at least one category."),
  amenities: csv,
  badges: csv,
  images: z
    .array(z.string().trim().url())
    .min(1, "Add at least one image.")
    .max(12, "Twelve images maximum."),
  status: z.enum(["draft", "pending_review", "published"]).default("draft"),
});

export type PropertyInput = z.input<typeof propertyInputSchema>;
export type PropertyValues = z.output<typeof propertyInputSchema>;

export function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}
