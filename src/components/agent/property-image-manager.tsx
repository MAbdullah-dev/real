"use client";

import { ArrowLeft, ArrowRight, ImagePlus, Loader2, Trash2, Upload } from "lucide-react";
import Image from "next/image";
import * as React from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUploadThing } from "@/lib/uploadthing";

export function PropertyImageManager({
  images,
  onChange,
  uploadsEnabled,
}: {
  images: string[];
  onChange: (next: string[]) => void;
  uploadsEnabled: boolean;
}) {
  const fileInput = React.useRef<HTMLInputElement>(null);
  const [manualUrl, setManualUrl] = React.useState("");

  const { startUpload, isUploading } = useUploadThing("propertyImage", {
    onClientUploadComplete: (files) => {
      onChange([...images, ...files.map((file) => file.ufsUrl)].slice(0, 12));
      toast.success(`${files.length} photo${files.length === 1 ? "" : "s"} uploaded`);
    },
    onUploadError: (error) => {
      toast.error(error.message);
    },
  });

  function move(from: number, to: number) {
    if (to < 0 || to >= images.length) return;
    const next = [...images];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next);
  }

  function addManualUrl() {
    const url = manualUrl.trim();
    if (!url) return;
    try {
      new URL(url);
    } catch {
      toast.error("Enter a full image URL starting with https://");
      return;
    }
    if (images.includes(url)) {
      toast.error("That image is already in the gallery.");
      return;
    }
    onChange([...images, url].slice(0, 12));
    setManualUrl("");
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <input
          ref={fileInput}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(event) => {
            const files = Array.from(event.target.files ?? []);
            if (files.length) void startUpload(files);
            event.target.value = "";
          }}
        />
        <Button
          type="button"
          variant="outline"
          className="rounded-full"
          disabled={!uploadsEnabled || isUploading || images.length >= 12}
          onClick={() => fileInput.current?.click()}
        >
          {isUploading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Upload className="mr-2 h-4 w-4" />
          )}
          {isUploading ? "Uploading…" : "Upload photos"}
        </Button>
        <p className="text-xs text-muted-foreground">
          {uploadsEnabled
            ? "JPG or PNG up to 8MB. The first photo is the cover."
            : "Set UPLOADTHING_TOKEN to enable direct uploads — paste image URLs below meanwhile."}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Input
          value={manualUrl}
          placeholder="https://images.example.com/photo.jpg"
          onChange={(event) => setManualUrl(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              addManualUrl();
            }
          }}
          className="max-w-md"
        />
        <Button
          type="button"
          variant="secondary"
          className="rounded-full"
          onClick={addManualUrl}
          disabled={images.length >= 12}
        >
          <ImagePlus className="mr-2 h-4 w-4" />
          Add URL
        </Button>
      </div>

      {images.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          No photos yet. Add at least one before publishing.
        </p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {images.map((url, index) => (
            <li
              key={url}
              className="group relative overflow-hidden rounded-2xl border border-border bg-muted/30"
            >
              <div className="relative aspect-4/3">
                <Image
                  src={url}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, 320px"
                  unoptimized
                />
              </div>
              {index === 0 ? (
                <span className="absolute left-2 top-2 rounded-full bg-primary px-2 py-0.5 text-[11px] font-medium text-primary-foreground">
                  Cover
                </span>
              ) : null}
              <div className="flex items-center justify-between gap-1 p-2">
                <div className="flex gap-1">
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    aria-label="Move earlier"
                    onClick={() => move(index, index - 1)}
                    disabled={index === 0}
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    aria-label="Move later"
                    onClick={() => move(index, index + 1)}
                    disabled={index === images.length - 1}
                  >
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-destructive"
                  aria-label="Remove photo"
                  onClick={() => onChange(images.filter((item) => item !== url))}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
