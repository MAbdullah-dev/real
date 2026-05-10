"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, MapPin, Search, SlidersHorizontal, Sparkles } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import type { Swiper as SwiperType } from "swiper";
import { Autoplay, EffectFade } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MOCK_PROPERTIES } from "@/data/properties";
import { formatPrice } from "@/lib/utils";
import type { Property } from "@/types";

import "swiper/css";
import "swiper/css/effect-fade";

function pickHeroProperties(): Property[] {
  const scored = [...MOCK_PROPERTIES].sort((a, b) => {
    const score = (p: Property) =>
      (p.categories.includes("luxury") ? 3 : 0) +
      (p.categories.includes("penthouse") ? 2 : 0) +
      (p.categories.includes("featured") ? 2 : 0) +
      p.rating;
    return score(b) - score(a);
  });
  const unique = scored.slice(0, 7);
  return unique.length >= 4 ? unique : MOCK_PROPERTIES.slice(0, 6);
}

export function CinematicHero() {
  const router = useRouter();
  const slides = useMemo(() => pickHeroProperties(), []);
  const swiperRef = useRef<SwiperType | null>(null);
  const [active, setActive] = useState(0);
  const [q, setQ] = useState("");
  const [purpose, setPurpose] = useState("all");

  const current = slides[active] ?? slides[0];

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (purpose !== "all") params.set("purpose", purpose);
    router.push(`/search?${params.toString()}`);
  }

  const priceLabel =
    current.purpose === "rent"
      ? `${formatPrice(current.price)}/mo`
      : formatPrice(current.price);

  return (
    <section
      className="relative isolate min-h-[100dvh] w-full overflow-hidden bg-black"
      aria-label="Featured properties"
    >
      {/* Layer 0: imagery only — must stay below all UI */}
      <div className="absolute inset-0 z-0">
        <Swiper
          modules={[Autoplay, EffectFade]}
          effect="fade"
          fadeEffect={{ crossFade: true }}
          speed={1400}
          loop
          autoplay={{
            delay: 6500,
            disableOnInteraction: false,
            pauseOnMouseEnter: true,
          }}
          onSwiper={(s) => {
            swiperRef.current = s;
          }}
          onSlideChange={(s) => setActive(s.realIndex)}
          className="h-full w-full [&_.swiper-wrapper]:h-full [&_.swiper-slide]:h-full"
        >
          {slides.map((p) => (
            <SwiperSlide key={p.id} className="!h-full">
              <div className="relative h-full min-h-[100dvh] w-full">
                <Image
                  src={p.image}
                  alt=""
                  fill
                  priority={p.id === slides[0]?.id}
                  className="hero-slide-media object-cover"
                  sizes="100vw"
                  quality={92}
                />
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

      {/* Layer 1: grades (non-interactive) */}
      <div
        className="pointer-events-none absolute inset-0 z-[1]"
        style={{
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.15) 38%, rgba(0,0,0,0.35) 68%, rgba(0,0,0,0.82) 100%)",
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 z-[1]"
        style={{
          background:
            "linear-gradient(90deg, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.18) 45%, rgba(0,0,0,0.42) 100%)",
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 z-[1] [box-shadow:inset_0_0_120px_rgba(0,0,0,0.35)]"
        aria-hidden
      />

      {/* Layer 2: all copy + controls + search — always above slides */}
      <div className="pointer-events-none absolute inset-0 z-20 flex min-h-[100dvh] flex-col justify-between pb-6 pt-24 sm:pb-10 sm:pt-28 md:pt-32">
        <div className="pointer-events-auto flex min-h-0 flex-1 flex-col justify-center px-[var(--section-x)]">
          <div className="mx-auto w-full max-w-[var(--page-wide)]">
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/90 backdrop-blur-xl sm:text-xs"
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-200/90" />
              Private views · Verified agents
            </motion.div>

            <div className="mt-8 max-w-4xl">
              <AnimatePresence mode="wait">
                <motion.div
                  key={current.id}
                  initial={{ opacity: 0, y: 18, filter: "blur(6px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: -10, filter: "blur(4px)" }}
                  transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                >
                  <p className="text-sm font-medium text-white/75 sm:text-base">
                    {current.city} · {current.country}
                  </p>
                  <h1 className="mt-3 text-balance text-4xl font-semibold leading-[1.05] tracking-tight text-white sm:text-5xl md:text-6xl lg:text-[4.25rem]">
                    {current.title}
                  </h1>
                  <p className="mt-5 max-w-2xl text-pretty text-base leading-relaxed text-white/80 sm:text-lg">
                    {current.description.slice(0, 148)}
                    {current.description.length > 148 ? "…" : ""}
                  </p>
                  <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
                    <div className="flex items-baseline gap-3 text-white">
                      <span className="text-xs font-semibold uppercase tracking-wider text-white/55">
                        {current.purpose === "rent" ? "Monthly" : "Asking"}
                      </span>
                      <span className="text-3xl font-semibold tabular-nums tracking-tight sm:text-4xl">
                        {priceLabel}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <Button
                        asChild
                        size="lg"
                        className="h-12 rounded-full px-8 text-base shadow-[0_20px_60px_-20px_rgba(0,0,0,0.65)]"
                      >
                        <Link href={`/properties/${current.slug}`}>Experience this home</Link>
                      </Button>
                      <Button
                        asChild
                        size="lg"
                        variant="outline"
                        className="h-12 rounded-full border-white/35 bg-white/10 px-7 text-base text-white backdrop-blur-md hover:bg-white/20"
                      >
                        <Link href={`/booking/${current.id}`}>Reserve a visit</Link>
                      </Button>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>

        <div className="pointer-events-auto px-[var(--section-x)]">
          <div className="mx-auto w-full max-w-[var(--page-wide)]">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    className="h-11 w-11 rounded-full border-white/25 bg-black/35 text-white backdrop-blur-md hover:bg-black/45 sm:h-12 sm:w-12"
                    onClick={() => swiperRef.current?.slidePrev()}
                    aria-label="Previous story"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    className="h-11 w-11 rounded-full border-white/25 bg-black/35 text-white backdrop-blur-md hover:bg-black/45 sm:h-12 sm:w-12"
                    onClick={() => swiperRef.current?.slideNext()}
                    aria-label="Next story"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                  <p className="ml-1 text-xs font-medium text-white/55">
                    <span className="tabular-nums text-white/90">{String(active + 1).padStart(2, "0")}</span>
                    <span className="mx-1 text-white/35">/</span>
                    <span className="tabular-nums">{String(slides.length).padStart(2, "0")}</span>
                  </p>
                </div>
                <div className="flex items-center gap-1.5 sm:ml-2" role="tablist" aria-label="Featured homes">
                  {slides.map((s, i) => (
                    <button
                      key={s.id}
                      type="button"
                      role="tab"
                      aria-selected={i === active}
                      aria-label={`Show ${s.title}`}
                      className={`h-1.5 rounded-full transition-all duration-500 ${
                        i === active ? "w-9 bg-white shadow-[0_0_24px_rgba(255,255,255,0.35)]" : "w-2.5 bg-white/35 hover:bg-white/55"
                      }`}
                      onClick={() => swiperRef.current?.slideToLoop(i)}
                    />
                  ))}
                </div>
              </div>

              <motion.form
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
                onSubmit={submitSearch}
                className="w-full rounded-[1.75rem] border border-white/20 bg-white/12 p-3 shadow-[0_24px_80px_-30px_rgba(0,0,0,0.75)] backdrop-blur-2xl sm:rounded-[2rem] sm:p-4 lg:max-w-[min(100%,56rem)] lg:ml-auto"
              >
                <p className="mb-3 px-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/60">
                  Plan your stay
                </p>
                <div className="grid gap-2 sm:grid-cols-[1.25fr_0.85fr_auto] sm:items-center">
                  <div className="relative">
                    <MapPin className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/45" />
                    <Input
                      value={q}
                      onChange={(e) => setQ(e.target.value)}
                      placeholder="Where to next?"
                      className="h-12 rounded-2xl border-white/15 bg-black/25 pl-11 text-white placeholder:text-white/45 focus-visible:ring-white/30"
                      aria-label="Destination search"
                    />
                  </div>
                  <Select value={purpose} onValueChange={setPurpose}>
                    <SelectTrigger className="h-12 rounded-2xl border-white/15 bg-black/25 text-white data-[placeholder]:text-white/45">
                      <SelectValue placeholder="Purpose" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Any purpose</SelectItem>
                      <SelectItem value="sale">Purchase</SelectItem>
                      <SelectItem value="rent">Lease</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex gap-2 sm:justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      className="h-12 flex-1 rounded-2xl border-white/20 bg-black/20 text-white hover:bg-black/30 sm:flex-none"
                      asChild
                    >
                      <Link href="/search" className="gap-2">
                        <SlidersHorizontal className="h-4 w-4" />
                        <span className="hidden sm:inline">Filters</span>
                      </Link>
                    </Button>
                    <Button
                      type="submit"
                      className="h-12 flex-1 rounded-2xl bg-white px-6 text-base font-semibold text-black hover:bg-white/90 sm:min-w-[132px]"
                    >
                      <Search className="mr-2 h-4 w-4" />
                      Search
                    </Button>
                  </div>
                </div>
                <p className="mt-3 px-1 text-xs text-white/50">
                  Trending{" "}
                  <Link href="/search?q=Dubai" className="text-white/80 underline-offset-4 hover:underline">
                    Dubai
                  </Link>
                  ,{" "}
                  <Link href="/search?q=Lisbon" className="text-white/80 underline-offset-4 hover:underline">
                    Lisbon
                  </Link>
                  ,{" "}
                  <Link href="/search?q=Malibu" className="text-white/80 underline-offset-4 hover:underline">
                    Malibu
                  </Link>
                </p>
              </motion.form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
