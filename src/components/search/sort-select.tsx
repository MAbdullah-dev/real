"use client";

import { useRouter, useSearchParams } from "next/navigation";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PROPERTY_SORTS, type PropertySort } from "@/server/property-filters";

export function SortSelect({ value }: { value: PropertySort }) {
  const router = useRouter();
  const params = useSearchParams();

  return (
    <div className="flex items-center gap-2">
      <Label htmlFor="sort" className="text-xs text-muted-foreground">
        Sort
      </Label>
      <Select
        value={value}
        onValueChange={(next) => {
          const query = new URLSearchParams(params.toString());
          if (next === "recommended") query.delete("sort");
          else query.set("sort", next);
          router.push(`/search?${query.toString()}`);
        }}
      >
        <SelectTrigger id="sort" className="h-9 w-[11.5rem]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(PROPERTY_SORTS).map(([key, label]) => (
            <SelectItem key={key} value={key}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
