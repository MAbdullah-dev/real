"use client";

import { ArrowRight } from "lucide-react";
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
    <section className="py-14 sm:py-20 lg:py-24">
      <LayoutWide className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-3xl">
          <h2 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl lg:text-[2rem] lg:leading-tight">
            {title}
          </h2>
          <p className="mt-3 text-base leading-relaxed text-muted-foreground sm:text-lg">{subtitle}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:shrink-0 sm:justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-full"
            onClick={() => swiperRef.current?.slidePrev()}
          >
            Prev
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-full"
            onClick={() => swiperRef.current?.slideNext()}
          >
            Next
          </Button>
          <Button asChild variant="ghost" className="rounded-full gap-1">
            <Link href={viewAllHref}>
              View all
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </LayoutWide>

      {/* Full-bleed slider: only horizontal padding aligns to section rhythm */}
      <div className="mt-10 w-full pl-[var(--section-x)]">
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
          className="property-row-swiper !overflow-visible"
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
