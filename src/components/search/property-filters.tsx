"use client";

import { Search, SlidersHorizontal } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { useIsMobile } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";

const BAR_TRIGGER = "h-10 rounded-xl border-border/70 bg-background shadow-none transition-colors hover:bg-muted/40";

function countRefinements(params: URLSearchParams): number {
  let n = 0;
  if (params.get("purpose")) n++;
  if (params.get("type") && params.get("type") !== "all") n++;
  if (params.get("bedrooms") && params.get("bedrooms") !== "0") n++;
  if (params.get("bathrooms") && params.get("bathrooms") !== "0") n++;
  if (params.get("furnished") && params.get("furnished") !== "all") n++;
  const minP = params.get("minPrice");
  const maxP = params.get("maxPrice");
  if (minP != null && minP !== "" && Number(minP) > 0) n++;
  if (maxP != null && maxP !== "" && Number(maxP) < 12_000_000) n++;
  return n;
}
const PROPERTY_TYPES = [
  { value: "all", label: "All types" },
  { value: "apartment", label: "Apartment" },
  { value: "villa", label: "Villa" },
  { value: "penthouse", label: "Penthouse" },
  { value: "luxury", label: "Luxury" },
  { value: "office", label: "Office" },
  { value: "commercial", label: "Commercial" },
  { value: "beach", label: "Beach house" },
];

function FiltersForm({
  onApply,
  initial,
  variant = "stacked",
}: {
  onApply: (next: Record<string, string>) => void;
  initial: Record<string, string>;
  variant?: "stacked" | "bar";
}) {
  const [purpose, setPurpose] = useState(initial.purpose ?? "all");
  const [type, setType] = useState(initial.type ?? "all");
  const [bedrooms, setBedrooms] = useState(initial.bedrooms ?? "0");
  const [bathrooms, setBathrooms] = useState(initial.bathrooms ?? "0");
  const [furnished, setFurnished] = useState(initial.furnished ?? "all");
  const [priceRange, setPriceRange] = useState<[number, number]>([
    Number(initial.minPrice ?? 0),
    Number(initial.maxPrice ?? 12_000_000),
  ]);

  function apply() {
    const next: Record<string, string> = {};
    if (purpose !== "all") next.purpose = purpose;
    if (type !== "all") next.type = type;
    if (bedrooms !== "0") next.bedrooms = bedrooms;
    if (bathrooms !== "0") next.bathrooms = bathrooms;
    if (furnished !== "all") next.furnished = furnished;
    if (priceRange[0] > 0) next.minPrice = String(priceRange[0]);
    if (priceRange[1] < 12_000_000) next.maxPrice = String(priceRange[1]);
    onApply(next);
  }

  function reset() {
    setPurpose("all");
    setType("all");
    setBedrooms("0");
    setBathrooms("0");
    setFurnished("all");
    setPriceRange([0, 12_000_000]);
    onApply({});
  }

  const purposeField = (
    <div className="space-y-1.5">
      <Label className={variant === "bar" ? "text-[11px] font-medium uppercase tracking-wide text-muted-foreground" : undefined}>
        Purpose
      </Label>
      <Select value={purpose} onValueChange={setPurpose}>
        <SelectTrigger className={variant === "bar" ? BAR_TRIGGER : undefined}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Any</SelectItem>
          <SelectItem value="sale">Buy</SelectItem>
          <SelectItem value="rent">Rent</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );

  const typeField = (
    <div className="space-y-1.5">
      <Label className={variant === "bar" ? "text-[11px] font-medium uppercase tracking-wide text-muted-foreground" : undefined}>
        Type
      </Label>
      <Select value={type} onValueChange={setType}>
        <SelectTrigger className={variant === "bar" ? cn(BAR_TRIGGER, "min-w-[9.5rem]") : undefined}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {PROPERTY_TYPES.map((t) => (
            <SelectItem key={t.value} value={t.value}>
              {t.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  const bedsField = (
    <div className="space-y-1.5">
      <Label className={variant === "bar" ? "text-[11px] font-medium uppercase tracking-wide text-muted-foreground" : undefined}>
        Beds
      </Label>
      <Select value={bedrooms} onValueChange={setBedrooms}>
        <SelectTrigger className={variant === "bar" ? BAR_TRIGGER : undefined}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="0">Any</SelectItem>
          {[1, 2, 3, 4, 5].map((n) => (
            <SelectItem key={n} value={String(n)}>
              {n}+
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  const bathsField = (
    <div className="space-y-1.5">
      <Label className={variant === "bar" ? "text-[11px] font-medium uppercase tracking-wide text-muted-foreground" : undefined}>
        Baths
      </Label>
      <Select value={bathrooms} onValueChange={setBathrooms}>
        <SelectTrigger className={variant === "bar" ? BAR_TRIGGER : undefined}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="0">Any</SelectItem>
          {[1, 2, 3, 4].map((n) => (
            <SelectItem key={n} value={String(n)}>
              {n}+
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  const furnishedField = (
    <div className="space-y-1.5">
      <Label className={variant === "bar" ? "text-[11px] font-medium uppercase tracking-wide text-muted-foreground" : undefined}>
        Furnished
      </Label>
      <Select value={furnished} onValueChange={setFurnished}>
        <SelectTrigger className={variant === "bar" ? cn(BAR_TRIGGER, "min-w-[8.5rem]") : undefined}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Any</SelectItem>
          <SelectItem value="yes">Furnished</SelectItem>
          <SelectItem value="no">Unfurnished</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );

  const priceField = (
    <div className="space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <Label className={variant === "bar" ? "text-[11px] font-medium uppercase tracking-wide text-muted-foreground" : undefined}>
          Price (USD)
        </Label>
        {variant === "bar" ? (
          <p className="text-sm font-semibold tabular-nums text-foreground">
            ${priceRange[0].toLocaleString()} — ${priceRange[1].toLocaleString()}
          </p>
        ) : null}
      </div>
      <Slider
        value={priceRange}
        min={0}
        max={12_000_000}
        step={50_000}
        onValueChange={(v) => setPriceRange(v as [number, number])}
      />
      {variant !== "bar" ? (
        <p className="text-xs text-muted-foreground">
          ${priceRange[0].toLocaleString()} — ${priceRange[1].toLocaleString()}
        </p>
      ) : null}
    </div>
  );

  const parkingRow = (
    <div className="flex items-center gap-2.5 rounded-xl border border-border/60 bg-muted/25 px-3 py-2.5">
      <Checkbox id="features-parking" />
      <Label htmlFor="features-parking" className="cursor-pointer font-normal text-sm leading-none">
        Parking / EV
      </Label>
    </div>
  );

  const actionsRow = (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <Button type="button" variant="ghost" size="sm" className="rounded-full text-muted-foreground" onClick={reset}>
        Clear all
      </Button>
      <Button type="button" size="sm" className="min-w-[7.5rem] rounded-full px-6" onClick={apply}>
        Apply filters
      </Button>
    </div>
  );

  if (variant === "bar") {
    return (
      <div className="space-y-5">
        <div className="flex flex-wrap items-end gap-x-3 gap-y-4">
          <div className="min-w-[min(100%,8.5rem)] flex-1 basis-[8.5rem]">{purposeField}</div>
          <div className="min-w-[min(100%,12rem)] flex-[1.35] basis-[12rem]">{typeField}</div>
          <div className="min-w-[min(100%,6.5rem)] flex-1 basis-[6.5rem]">{bedsField}</div>
          <div className="min-w-[min(100%,6.5rem)] flex-1 basis-[6.5rem]">{bathsField}</div>
          <div className="min-w-[min(100%,9rem)] flex-1 basis-[9rem]">{furnishedField}</div>
        </div>

        <div className="rounded-2xl border border-border/60 bg-muted/20 p-4 sm:p-5">{priceField}</div>

        <div className="flex flex-col gap-3 border-t border-border/70 pt-4 sm:flex-row sm:items-center sm:justify-between">
          {parkingRow}
          {actionsRow}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {purposeField}
      {typeField}
      <div className="grid grid-cols-2 gap-3">
        {bedsField}
        {bathsField}
      </div>
      {priceField}
      {furnishedField}
      {parkingRow}
      <Separator />
      <div className="flex gap-2">
        <Button type="button" className="flex-1 rounded-full" onClick={apply}>
          Apply filters
        </Button>
        <Button type="button" variant="outline" className="rounded-full" onClick={reset}>
          Clear
        </Button>
      </div>
    </div>
  );
}

export function SearchExplorePanel({ defaultQuery }: { defaultQuery: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const isMobile = useIsMobile();
  const [qDraft, setQDraft] = useState(defaultQuery);

  useEffect(() => {
    setQDraft(defaultQuery);
  }, [defaultQuery]);

  const initial = useMemo(() => {
    const o: Record<string, string> = {};
    params.forEach((v, k) => {
      o[k] = v;
    });
    return o;
  }, [params]);

  const refinementCount = useMemo(() => countRefinements(params), [params]);

  const pushWithFilters = useCallback(
    (filters: Record<string, string>) => {
      const next = new URLSearchParams();
      const q = qDraft.trim();
      if (q) next.set("q", q);
      Object.entries(filters).forEach(([k, v]) => {
        if (v && v !== "0" && v !== "all") next.set(k, v);
      });
      router.push(`/search?${next.toString()}`);
    },
    [router, qDraft]
  );

  const mergeSearchOnly = useCallback(() => {
    const next = new URLSearchParams(params.toString());
    const q = qDraft.trim();
    if (q) next.set("q", q);
    else next.delete("q");
    router.push(`/search?${next.toString()}`);
  }, [params, qDraft, router]);

  const innerStacked = <FiltersForm onApply={pushWithFilters} initial={initial} variant="stacked" />;

  return (
    <div className="relative overflow-hidden rounded-3xl border border-border/80 bg-card shadow-[var(--shadow-card)]">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-primary/[0.06] to-transparent dark:from-primary/[0.1]"
        aria-hidden
      />
      <div className="relative p-5 sm:p-6 lg:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 gap-3.5">
            <span
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/12 text-primary shadow-sm"
              aria-hidden
            >
              <SlidersHorizontal className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Discovery
              </p>
              <h2 className="mt-1 text-lg font-semibold tracking-tight sm:text-xl">
                Find your next property
              </h2>
              <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-muted-foreground">
                Search by place or keyword, then adjust deal type and budget.
              </p>
            </div>
          </div>
          <div className="shrink-0 sm:pt-1">
            {refinementCount > 0 ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary" aria-hidden />
                {refinementCount} active {refinementCount === 1 ? "filter" : "filters"}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/35 px-3 py-1 text-xs text-muted-foreground">
                No filters applied
              </span>
            )}
          </div>
        </div>

        <div className="mt-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
            <div className="relative min-h-0 flex-1">
              <Search
                className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <Input
                value={qDraft}
                onChange={(e) => setQDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    mergeSearchOnly();
                  }
                }}
                placeholder="City, neighborhood, or keyword"
                aria-label="Search by keyword"
                className="h-12 rounded-full pl-11 pr-4 shadow-sm"
              />
            </div>
            <Button
              type="button"
              size="lg"
              className="h-12 shrink-0 px-7 sm:px-8"
              onClick={mergeSearchOnly}
            >
              Search
            </Button>
          </div>
        </div>

        {!isMobile ? (
          <div className="mt-7 border-t border-border/60 pt-7">
            <FiltersForm onApply={pushWithFilters} initial={initial} variant="bar" />
          </div>
        ) : (
          <div className="mt-4">
            <Drawer>
              <DrawerTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  className="h-12 w-full justify-between gap-2 text-sm font-medium"
                >
                  <span className="flex items-center gap-2">
                    <SlidersHorizontal className="h-4 w-4" aria-hidden />
                    Adjust filters
                  </span>
                  {refinementCount > 0 ? (
                    <span
                      className="inline-flex h-6 min-w-[1.5rem] items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-semibold text-primary-foreground"
                      aria-label={`${refinementCount} active`}
                    >
                      {refinementCount}
                    </span>
                  ) : null}
                </Button>
              </DrawerTrigger>
              <DrawerContent className="max-h-[88dvh] border-t border-border/80">
                <DrawerHeader className="border-b border-border/60 text-left">
                  <DrawerTitle>Refine results</DrawerTitle>
                  <p className="text-sm font-normal text-muted-foreground">
                    Tap Apply filters to save changes. Your keyword above stays in place.
                  </p>
                </DrawerHeader>
                <div className="max-h-[min(70dvh,560px)] overflow-y-auto overscroll-contain px-4 pb-10 pt-4">
                  {innerStacked}
                </div>
              </DrawerContent>
            </Drawer>
          </div>
        )}
      </div>
    </div>
  );
}
