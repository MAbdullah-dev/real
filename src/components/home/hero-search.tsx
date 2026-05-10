"use client";

import { motion } from "framer-motion";
import { MapPin, Search, SlidersHorizontal, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function HeroSearch() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [purpose, setPurpose] = useState("all");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (purpose !== "all") params.set("purpose", purpose);
    router.push(`/search?${params.toString()}`);
  }

  return (
    <section className="relative overflow-hidden">
      <div
        className="absolute inset-0 mesh-bg opacity-90"
        aria-hidden
        style={{ background: "var(--gradient-hero)" }}
      />
      <div className="relative mx-auto max-w-7xl px-4 pb-20 pt-16 sm:px-6 sm:pb-28 sm:pt-24 lg:px-8 lg:pt-28">
        <div className="max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-primary-foreground backdrop-blur-md"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Curated visits · Human confirmation · Global portfolio
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.05 }}
            className="mt-6 text-4xl font-semibold tracking-tight text-primary-foreground sm:text-5xl lg:text-6xl text-balance"
          >
            Discover homes worth the journey.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.1 }}
            className="mt-5 max-w-xl text-base leading-relaxed text-primary-foreground/85 sm:text-lg"
          >
            Book private viewings, explore cinematic listings, and collaborate with verified agents —
            orchestrated like a luxury hospitality brand, built for serious buyers and renters.
          </motion.p>
        </div>

        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.15 }}
          onSubmit={submit}
          className="mt-10 glass-panel max-w-4xl rounded-[2rem] p-4 shadow-[var(--shadow-soft)] sm:p-5"
        >
          <div className="grid gap-3 lg:grid-cols-[1.4fr_0.7fr_auto] lg:items-center">
            <div className="relative">
              <MapPin className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="City, neighborhood, or landmark"
                className="h-12 rounded-2xl border-border/60 bg-background/90 pl-11"
                aria-label="Location search"
              />
            </div>
            <Select value={purpose} onValueChange={setPurpose}>
              <SelectTrigger className="h-12 rounded-2xl border-border/60 bg-background/90">
                <SelectValue placeholder="Purpose" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any purpose</SelectItem>
                <SelectItem value="sale">Purchase</SelectItem>
                <SelectItem value="rent">Lease</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-2 lg:justify-end">
              <Button
                type="button"
                variant="outline"
                className="h-12 flex-1 rounded-2xl lg:flex-none"
                asChild
              >
                <Link href="/search" className="gap-2">
                  <SlidersHorizontal className="h-4 w-4" />
                  Filters
                </Link>
              </Button>
              <Button type="submit" className="h-12 flex-1 rounded-2xl lg:min-w-[140px] gap-2">
                <Search className="h-4 w-4" />
                Search
              </Button>
            </div>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Popular:{" "}
            <Link href="/search?q=Dubai" className="underline-offset-2 hover:underline">
              Dubai
            </Link>
            ,{" "}
            <Link href="/search?q=Lisbon" className="underline-offset-2 hover:underline">
              Lisbon
            </Link>
            ,{" "}
            <Link href="/search?q=Miami" className="underline-offset-2 hover:underline">
              Miami
            </Link>
          </p>
        </motion.form>
      </div>
    </section>
  );
}
