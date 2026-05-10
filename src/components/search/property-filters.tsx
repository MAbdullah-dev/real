"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";

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
import { Slider } from "@/components/ui/slider";
import { useIsMobile } from "@/hooks/use-media-query";
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
}: {
  onApply: (next: Record<string, string>) => void;
  initial: Record<string, string>;
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
    next.minPrice = String(priceRange[0]);
    next.maxPrice = String(priceRange[1]);
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

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Purpose</Label>
        <Select value={purpose} onValueChange={setPurpose}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any</SelectItem>
            <SelectItem value="sale">Buy</SelectItem>
            <SelectItem value="rent">Rent</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Property type</Label>
        <Select value={type} onValueChange={setType}>
          <SelectTrigger>
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

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Bedrooms</Label>
          <Select value={bedrooms} onValueChange={setBedrooms}>
            <SelectTrigger>
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
        <div className="space-y-2">
          <Label>Bathrooms</Label>
          <Select value={bathrooms} onValueChange={setBathrooms}>
            <SelectTrigger>
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
      </div>

      <div className="space-y-3">
        <Label>Price range (USD)</Label>
        <Slider
          value={priceRange}
          min={0}
          max={12_000_000}
          step={50_000}
          onValueChange={(v) => setPriceRange(v as [number, number])}
        />
        <p className="text-xs text-muted-foreground">
          ${priceRange[0].toLocaleString()} — ${priceRange[1].toLocaleString()}
        </p>
      </div>

      <div className="space-y-2">
        <Label>Furnished</Label>
        <Select value={furnished} onValueChange={setFurnished}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any</SelectItem>
            <SelectItem value="yes">Furnished</SelectItem>
            <SelectItem value="no">Unfurnished</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <Checkbox id="features-parking" />
        <Label htmlFor="features-parking" className="font-normal">
          Parking / EV
        </Label>
      </div>

      <Separator />

      <div className="flex gap-2">
        <Button type="button" className="flex-1 rounded-full" onClick={apply}>
          Apply
        </Button>
        <Button type="button" variant="outline" className="rounded-full" onClick={reset}>
          Reset
        </Button>
      </div>
    </div>
  );
}

export function PropertyFilters() {
  const router = useRouter();
  const params = useSearchParams();
  const isMobile = useIsMobile();

  const initial = useMemo(() => {
    const o: Record<string, string> = {};
    params.forEach((v, k) => {
      o[k] = v;
    });
    return o;
  }, [params]);

  const apply = useCallback(
    (filters: Record<string, string>) => {
      const next = new URLSearchParams();
      const q = params.get("q");
      if (q) next.set("q", q);
      Object.entries(filters).forEach(([k, v]) => {
        if (v && v !== "0" && v !== "all") next.set(k, v);
      });
      router.push(`/search?${next.toString()}`);
    },
    [params, router]
  );

  const inner = <FiltersForm onApply={apply} initial={initial} />;

  if (isMobile) {
    return (
      <Drawer>
        <DrawerTrigger asChild>
          <Button variant="outline" className="w-full rounded-full gap-2">
            Filters
          </Button>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Refine results</DrawerTitle>
          </DrawerHeader>
          <div className="max-h-[70vh] overflow-y-auto px-4 pb-8">{inner}</div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <aside className="sticky top-24 hidden h-fit rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-card)] lg:block">
      <h2 className="text-sm font-semibold">Advanced filters</h2>
      <p className="mt-1 text-xs text-muted-foreground">Tune the portfolio to your brief.</p>
      <div className="mt-6">{inner}</div>
    </aside>
  );
}
