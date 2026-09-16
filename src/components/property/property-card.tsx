"use client";

import { motion } from "framer-motion";
import { Bath, Bed, Heart, MapPin, Maximize2, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn, formatPrice } from "@/lib/utils";
import type { Property } from "@/types";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { useWishlistStore } from "@/store/wishlist-store";
import { toggleWishlist } from "@/server/actions/wishlist";

interface PropertyCardProps {
  property: Property;
  index?: number;
  /** Showcase = taller imagery + larger type for carousels */
  layout?: "default" | "showcase";
}

export function PropertyCard({ property, index = 0, layout = "default" }: PropertyCardProps) {
  const { data: session } = useSession();
  const toggle = useWishlistStore((s) => s.toggle);
  const saved = useWishlistStore((s) => s.ids.includes(property.id));
  const isShowcase = layout === "showcase";

  const priceLabel =
    property.purpose === "rent"
      ? `${formatPrice(property.price)}/mo`
      : formatPrice(property.price);

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.45, delay: index * 0.04, ease: [0.22, 1, 0.36, 1] }}
      className="group relative h-full"
    >
      <div
        className={cn(
          "relative flex h-full flex-col overflow-hidden rounded-2xl border border-border/70 bg-card shadow-[var(--shadow-card)] transition-[box-shadow,transform,border-color] duration-300 ease-[var(--motion-soft)] hover:-translate-y-0.5 hover:shadow-[var(--shadow-card-hover)] hover:border-border focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background motion-reduce:hover:translate-y-0 sm:rounded-3xl"
        )}
      >
        <Link
          href={`/properties/${property.slug}`}
          className="block focus-visible:outline-none"
          aria-label={`Open ${property.title}`}
        >
          <div
            className={cn(
              "relative overflow-hidden",
              isShowcase ? "aspect-[4/3.95] sm:aspect-[4/3.55]" : "aspect-[4/3]"
            )}
          >
            <Image
              src={property.image}
              alt={property.title}
              fill
              className="object-cover transition-transform duration-700 ease-[var(--motion-spring)] group-hover:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
              sizes={
                isShowcase
                  ? "(max-width:640px) 88vw, (max-width:1100px) 32vw, (max-width:1536px) 24vw, 20vw"
                  : "(max-width:768px) 100vw, (max-width:1400px) 33vw, 28vw"
              }
            />
            {/* Bottom-only gradient — keeps top of imagery crisp; only darkens enough to seat badges/heart */}
            <div
              className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/35 to-transparent"
              aria-hidden
            />
            <div className="absolute left-3 top-3 flex flex-wrap gap-1.5 sm:left-4 sm:top-4">
              {property.badges?.slice(0, 2).map((b) => (
                <Badge
                  key={b}
                  variant="accent"
                  className="border-white/20 bg-white/85 text-foreground shadow-sm backdrop-blur-md dark:bg-black/55 dark:text-white"
                >
                  {b}
                </Badge>
              ))}
              <Badge
                variant="secondary"
                className="border-white/20 bg-white/85 capitalize shadow-sm backdrop-blur-md dark:bg-black/55 dark:text-white"
              >
                {property.purpose === "rent" ? "Lease" : "Sale"}
              </Badge>
            </div>
            <Button
              type="button"
              size="icon"
              variant="secondary"
              className="absolute right-3 top-3 h-10 w-10 rounded-full border border-white/30 bg-white/90 text-foreground shadow-md backdrop-blur-md transition-colors hover:bg-white dark:border-white/15 dark:bg-black/55 dark:text-white sm:right-4 sm:top-4"
              onClick={(e) => {
                e.preventDefault();
                toggle(property.id);
                if (!session) {
                  toast.success(saved ? "Removed" : "Saved on this device", {
                    description: "Sign in to keep your list across devices.",
                  });
                  return;
                }
                void toggleWishlist(property.id).then((result) => {
                  if (!result.ok) {
                    // Keep the heart honest if the server rejected the change.
                    toggle(property.id);
                    toast.error("Could not update your saved list.");
                  }
                });
              }}
              aria-pressed={saved}
              aria-label={saved ? "Remove from wishlist" : "Save property"}
            >
              <Heart
                className={cn(
                  "h-[1.05rem] w-[1.05rem] text-primary transition-colors",
                  saved && "fill-primary"
                )}
              />
            </Button>
          </div>
        </Link>

        <div className="flex flex-1 flex-col gap-3 p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <Link
                href={`/properties/${property.slug}`}
                className="rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <h3
                  className={cn(
                    "line-clamp-2 font-semibold leading-snug tracking-tight transition-colors group-hover:text-primary",
                    isShowcase ? "text-base sm:text-lg" : "text-base"
                  )}
                >
                  {property.title}
                </h3>
              </Link>
              <p className="mt-1 flex items-center gap-1 truncate text-sm text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
                <span className="truncate">
                  {property.city}, {property.country}
                </span>
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p
                className={cn(
                  "font-semibold tabular-nums tracking-tight",
                  isShowcase ? "text-base sm:text-lg" : "text-sm"
                )}
              >
                {priceLabel}
              </p>
              {property.reviewCount > 0 ? (
                <p className="mt-0.5 flex items-center justify-end gap-1 text-xs text-muted-foreground">
                  <Star className="h-3.5 w-3.5 fill-accent text-accent" aria-hidden />
                  <span className="tabular-nums">{property.rating.toFixed(2)}</span>
                  <span className="text-muted-foreground/80">({property.reviewCount})</span>
                </p>
              ) : null}
            </div>
          </div>

          <div
            className={cn(
              "flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground",
              isShowcase ? "sm:text-sm" : ""
            )}
          >
            <span className="inline-flex items-center gap-1 rounded-full bg-muted/70 px-2.5 py-1">
              <Bed className="h-3.5 w-3.5" aria-hidden />
              <span>{property.bedrooms} beds</span>
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-muted/70 px-2.5 py-1">
              <Bath className="h-3.5 w-3.5" aria-hidden />
              <span>{property.bathrooms} baths</span>
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-muted/70 px-2.5 py-1">
              <Maximize2 className="h-3.5 w-3.5" aria-hidden />
              <span>{property.areaSqm} m²</span>
            </span>
          </div>

          <div className="mt-auto flex gap-2 pt-1 sm:flex-col">
            <Button
              asChild
              size={isShowcase ? "default" : "sm"}
              className={cn("flex-1", isShowcase ? "h-10 sm:h-11 px-4 sm:px-5 sm:py-3" : "")}
            >
              <Link href={`/booking/${property.id}`}>Request viewing</Link>
            </Button>
            <Button
              asChild
              size={isShowcase ? "default" : "sm"}
              variant="outline"
              className={cn(isShowcase ? "h-10 sm:h-11 px-4 sm:px-5" : "")}
              aria-label="Preview listing details"
            >
              <Link href={`/properties/${property.slug}`}>
                <Maximize2 className="h-4 w-4" aria-hidden />
                <span>Preview</span>
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </motion.article>
  );
}
