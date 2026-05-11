"use client";

import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useRef } from "react";
import type { Swiper as SwiperType } from "swiper";
import { Navigation } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

import { LayoutWide } from "@/components/layout/shell";
import { PropertyCard } from "@/components/property/property-card";
import { Button } from "@/components/ui/button";
import type { Property } from "@/types";

import "swiper/css";
import "swiper/css/navigation";

interface CategoryPropertyRowProps {
  title: string;
  subtitle: string;
  properties: Property[];
  viewAllHref: string;
}

export function CategoryPropertyRow({
  title,
  subtitle,
  properties,
  viewAllHref,
}: CategoryPropertyRowProps) {
  const swiperRef = useRef<SwiperType | null>(null);

  if (properties.length === 0) return null;

  return (
    <section className="overflow-x-clip py-12 sm:py-20 lg:py-24">
      <LayoutWide className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
        <div className="max-w-3xl shrink-0">
          <h2 className="text-xl font-semibold tracking-tight text-balance sm:text-3xl lg:text-[2rem] lg:leading-tight">
            {title}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:mt-3 sm:text-base lg:text-lg">
            {subtitle}
          </p>
        </div>
        <div className="flex items-center gap-2 sm:shrink-0 sm:justify-end">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-10 w-10"
            onClick={() => swiperRef.current?.slidePrev()}
            aria-label={`Previous ${title} listings`}
          >
            <ChevronLeft className="h-4 w-4" aria-hidden />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-10 w-10"
            onClick={() => swiperRef.current?.slideNext()}
            aria-label={`Next ${title} listings`}
          >
            <ChevronRight className="h-4 w-4" aria-hidden />
          </Button>
          <Button asChild variant="ghost" size="sm" className="ml-1 gap-1.5 px-3">
            <Link href={viewAllHref}>
              View all
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </Button>
        </div>
      </LayoutWide>

      {/* Full-bleed slider: horizontal padding matches section rhythm on both sides (mobile-friendly) */}
      <div className="mt-6 w-full px-[var(--section-x)] sm:mt-9 sm:pl-[var(--section-x)] sm:pr-0">
        <Swiper
          modules={[Navigation]}
          spaceBetween={20}
          slidesPerView={1.12}
          breakpoints={{
            480: { slidesPerView: 1.35, spaceBetween: 20 },
            640: { slidesPerView: 2.05, spaceBetween: 20 },
            900: { slidesPerView: 2.85, spaceBetween: 22 },
            1100: { slidesPerView: 3.45, spaceBetween: 22 },
            1280: { slidesPerView: 4.1, spaceBetween: 24 },
            1536: { slidesPerView: 4.55, spaceBetween: 26 },
            1920: { slidesPerView: 5.12, spaceBetween: 28 },
          }}
          onSwiper={(s) => {
            swiperRef.current = s;
          }}
          className="property-row-swiper !overflow-visible !py-2"
        >
          {properties.map((p, i) => (
            <SwiperSlide key={p.id} className="!h-auto">
              <PropertyCard property={p} index={i} layout="showcase" />
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  );
}
