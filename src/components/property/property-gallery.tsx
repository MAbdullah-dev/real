"use client";

import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { Navigation } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

import "swiper/css";
import "swiper/css/navigation";

export function PropertyGallery({ images, title }: { images: string[]; title: string }) {
  const [active, setActive] = useState(0);

  return (
    <div className="space-y-5">
      <motion.div
        layout
        className="relative aspect-[21/11] min-h-[min(52vh,420px)] overflow-hidden rounded-2xl border border-border/60 bg-muted shadow-[0_40px_120px_-50px_rgba(0,0,0,0.45)] sm:rounded-3xl sm:min-h-[min(58vh,720px)]"
      >
        <Image
          src={images[active] ?? images[0]}
          alt={title}
          fill
          className="object-cover"
          priority
          sizes="(max-width:768px) 100vw, min(100vw, 120rem)"
        />
        <button
          type="button"
          aria-label="Previous image"
          className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-background/80 text-foreground shadow-md backdrop-blur-md"
          onClick={() => setActive((i) => (i - 1 + images.length) % images.length)}
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          type="button"
          aria-label="Next image"
          className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-background/80 text-foreground shadow-md backdrop-blur-md"
          onClick={() => setActive((i) => (i + 1) % images.length)}
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </motion.div>
      <Swiper
        modules={[Navigation]}
        spaceBetween={14}
        slidesPerView={2.4}
        breakpoints={{ 640: { slidesPerView: 3.5 }, 1024: { slidesPerView: 4.8 }, 1536: { slidesPerView: 6 } }}
        className="!pb-1"
      >
        {images.map((src, i) => (
          <SwiperSlide key={src}>
            <button
              type="button"
              onClick={() => setActive(i)}
              className={`relative block aspect-[4/3] w-full overflow-hidden rounded-2xl ring-2 ring-offset-2 ring-offset-background transition ${
                active === i ? "ring-primary" : "ring-transparent opacity-80 hover:opacity-100"
              }`}
            >
              <Image src={src} alt="" fill className="object-cover" sizes="120px" />
            </button>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
