"use client";

import { motion } from "framer-motion";
import { Bath, Bed, Heart, MapPin, Maximize2, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn, formatPrice } from "@/lib/utils";
import type { Property } from "@/types";
import { useWishlistStore } from "@/store/wishlist-store";

interface PropertyCardProps {
  property: Property;
  index?: number;
  /** Showcase = taller imagery + larger type for carousels */
  layout?: "default" | "showcase";
}

export function PropertyCard({ property, index = 0, layout = "default" }: PropertyCardProps) {
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
          "relative flex h-full flex-col overflow-hidden rounded-[1.35rem] border border-border/60 bg-card shadow-[var(--shadow-card)] transition-[box-shadow,transform] duration-500 hover:-translate-y-0.5 hover:shadow-[var(--shadow-soft)] sm:rounded-3xl",
          isShowcase && "rounded-[1.5rem] border-white/10 shadow-[0_24px_80px_-40px_rgba(0,0,0,0.45)] dark:border-white/10"
        )}
      >
        <Link href={`/properties/${property.slug}`} className="block">
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
              className="object-cover transition duration-[1100ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.045]"
              sizes={
                isShowcase
                  ? "(max-width:640px) 88vw, (max-width:1100px) 32vw, (max-width:1536px) 24vw, 20vw"
                  : "(max-width:768px) 100vw, (max-width:1400px) 33vw, 28vw"
              }
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/10 to-transparent opacity-80 sm:opacity-90" />
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent mix-blend-overlay" />
            <div className="absolute left-3 top-3 flex flex-wrap gap-2 sm:left-4 sm:top-4">
              {property.badges?.slice(0, 2).map((b) => (
                <Badge key={b} variant="accent" className="backdrop-blur-md">
                  {b}
                </Badge>
              ))}
              <Badge variant="secondary" className="backdrop-blur-md capitalize">
                {property.purpose === "rent" ? "Lease" : "Sale"}
              </Badge>
            </div>
            <Button
              type="button"
              size="icon"
              variant="secondary"
              className={cn(
                "absolute right-3 top-3 rounded-full bg-background/85 shadow-md backdrop-blur-md sm:right-4 sm:top-4",
                "h-10 w-10"
              )}
              onClick={(e) => {
                e.preventDefault();
                toggle(property.id);
              }}
              aria-label={saved ? "Remove from wishlist" : "Save property"}
            >
              <Heart
                className={cn("h-5 w-5", saved ? "fill-primary text-primary" : "text-foreground")}
              />
            </Button>
          </div>
        </Link>

        <div className={cn("flex flex-1 flex-col space-y-3", isShowcase ? "p-4 sm:p-5" : "p-4 sm:p-5")}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <Link href={`/properties/${property.slug}`}>
                <h3
                  className={cn(
                    "font-semibold leading-snug tracking-tight transition-colors group-hover:text-primary",
                    isShowcase ? "text-base sm:text-lg" : "text-base"
                  )}
                >
                  {property.title}
                </h3>
              </Link>
              <p
                className={cn(
                  "mt-1 flex items-center gap-1 text-muted-foreground",
                    isShowcase ? "text-sm" : "text-sm"
                )}
              >
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                {property.city}, {property.country}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className={cn("font-semibold tabular-nums", isShowcase ? "text-sm sm:text-base" : "text-sm")}>
                {priceLabel}
              </p>
              <p
                className={cn(
                  "mt-0.5 flex items-center justify-end gap-1 text-muted-foreground",
                  isShowcase ? "text-xs" : "text-xs"
                )}
              >
                <Star className="h-3.5 w-3.5 text-accent" />
                <span className="tabular-nums">{property.rating.toFixed(2)}</span>
                <span>({property.reviewCount})</span>
              </p>
            </div>
          </div>

          <div
            className={cn(
              "flex flex-wrap items-center gap-2 text-muted-foreground",
              isShowcase ? "gap-2 text-xs sm:text-sm" : "gap-3 text-xs"
            )}
          >
            <span className="inline-flex items-center gap-1 rounded-full bg-muted/80 px-2.5 py-1">
              <Bed className="h-3.5 w-3.5" />
              {property.bedrooms} beds
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-muted/80 px-2.5 py-1">
              <Bath className="h-3.5 w-3.5" />
              {property.bathrooms} baths
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-muted/80 px-2.5 py-1">
              <Maximize2 className="h-3.5 w-3.5" />
              {property.areaSqm} m²
            </span>
          </div>

          <div className="mt-auto flex gap-2 pt-1">
            <Button
              asChild
              size={isShowcase ? "default" : "sm"}
              className={cn("flex-1 rounded-full", isShowcase && "h-10 sm:h-11")}
            >
              <Link href={`/booking/${property.id}`}>Reserve visit</Link>
            </Button>
            <Button
              asChild
              size={isShowcase ? "default" : "sm"}
              variant="outline"
              className={cn("rounded-full", isShowcase && "h-10 sm:h-11 px-4 sm:px-5")}
            >
              <Link href={`/properties/${property.slug}`}>
                <Maximize2 className="h-4 w-4" />
                Preview
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </motion.article>
  );
}
