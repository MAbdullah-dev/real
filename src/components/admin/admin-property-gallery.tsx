"use client";

import { Building2 } from "lucide-react";
import Image from "next/image";
import * as React from "react";

import { cn } from "@/lib/utils";

export function AdminPropertyGallery({
  title,
  images,
}: {
  title: string;
  images: Array<{ id: string; url: string }>;
}) {
  const [active, setActive] = React.useState(0);
  const current = images[active] ?? images[0];

  if (images.length === 0) {
    return (
      <div className="flex aspect-[16/10] w-full flex-col items-center justify-center gap-2 rounded-3xl border border-dashed border-border bg-muted/30 text-muted-foreground">
        <Building2 className="h-8 w-8" aria-hidden />
        <p className="text-sm">No photos uploaded</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative aspect-[16/10] w-full overflow-hidden rounded-3xl border border-border/70 bg-muted">
        <Image
          src={current.url}
          alt={`${title} — photo ${active + 1}`}
          fill
          className="object-cover"
          sizes="(max-width: 1280px) 100vw, 60vw"
          priority
        />
      </div>
      {images.length > 1 ? (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((image, index) => (
            <button
              key={image.id}
              type="button"
              onClick={() => setActive(index)}
              aria-label={`Show photo ${index + 1}`}
              aria-pressed={index === active}
              className={cn(
                "relative h-16 w-24 shrink-0 overflow-hidden rounded-xl border transition",
                index === active
                  ? "border-primary ring-2 ring-primary/30"
                  : "border-border/70 opacity-80 hover:opacity-100"
              )}
            >
              <Image src={image.url} alt="" fill className="object-cover" sizes="96px" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
