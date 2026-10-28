"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { PropertyImageManager } from "@/components/agent/property-image-manager";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  AvailabilityWindowsField,
  emptyWindow,
} from "@/components/viewings/availability-windows-field";
import { browserTimezone } from "@/lib/viewings";
import { cn } from "@/lib/utils";
import {
  createPropertyAction,
  createSellerPropertyAction,
  updatePropertyAction,
  updateSellerPropertyAction,
} from "@/server/actions/properties";
import { PROPERTY_CATEGORIES } from "@/server/property-input";

const formSchema = z.object({
  title: z.string().min(4, "Title needs at least 4 characters."),
  description: z.string().min(20, "Description needs at least 20 characters."),
  address: z.string().min(4, "Enter a street address."),
  city: z.string().min(2, "Enter a city."),
  country: z.string().min(2, "Enter a country."),
  price: z.number().int().positive("Price must be greater than zero."),
  purpose: z.enum(["sale", "rent"]),
  bedrooms: z.number().int().min(0).max(50),
  bathrooms: z.number().int().min(0).max(50),
  areaSqm: z.number().int().positive("Area must be greater than zero."),
  furnished: z.boolean(),
  videoUrl: z.string(),
  categories: z.array(z.enum(PROPERTY_CATEGORIES)).min(1, "Pick at least one category."),
  amenities: z.string(),
  badges: z.string(),
  images: z.array(z.string()).min(1, "Add at least one photo."),
  availableSlots: z.array(z.string()),
  availabilityWindows: z.array(
    z.object({
      start: z.string(),
      end: z.string(),
      durationMin: z.number(),
      bufferMin: z.number(),
      timezone: z.string().optional(),
    })
  ),
  status: z.enum(["draft", "pending_review", "published"]),
});

export type PropertyFormValues = z.infer<typeof formSchema>;

export const emptyPropertyForm: PropertyFormValues = {
  title: "",
  description: "",
  address: "",
  city: "",
  country: "",
  price: 500_000,
  purpose: "sale",
  bedrooms: 2,
  bathrooms: 2,
  areaSqm: 120,
  furnished: false,
  videoUrl: "",
  categories: ["apartment"],
  amenities: "",
  badges: "",
  images: [],
  availableSlots: [""],
  availabilityWindows: [emptyWindow()],
  status: "draft",
};

const categoryLabel = (value: string) =>
  value.replace(/-/g, " ").replace(/^\w/, (char) => char.toUpperCase());

export function PropertyForm({
  mode,
  propertyId,
  defaultValues,
  canPublish,
  uploadsEnabled,
  variant = "agency",
}: {
  mode: "create" | "edit";
  propertyId?: string;
  defaultValues: PropertyFormValues;
  canPublish: boolean;
  uploadsEnabled: boolean;
  variant?: "agency" | "seller";
}) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const form = useForm<PropertyFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const { errors, isSubmitting } = form.formState;
  const busy = pending || isSubmitting;

  function onSubmit(values: PropertyFormValues) {
    if (busy) return;

    startTransition(async () => {
      const payload = {
        ...values,
        videoUrl: values.videoUrl.trim() || undefined,
        availabilityWindows: values.availabilityWindows
          .filter((window) => window.start && window.end)
          .map((window) => ({
            ...window,
            start: new Date(window.start).toISOString(),
            end: new Date(window.end).toISOString(),
            timezone: browserTimezone(),
          })),
      };
      const result =
        mode === "create"
          ? variant === "seller"
            ? await createSellerPropertyAction(payload)
            : await createPropertyAction(payload)
          : variant === "seller"
            ? await updateSellerPropertyAction(propertyId!, payload)
            : await updatePropertyAction(propertyId!, payload);

      if (result?.error) {
        toast.error(result.error);
        for (const [field, message] of Object.entries(result.fieldErrors ?? {})) {
          form.setError(field as keyof PropertyFormValues, { message });
        }
        return;
      }

      toast.success(mode === "create" ? "Listing created" : "Listing saved");
      router.refresh();
    });
  }

  function onInvalid() {
    toast.error("Please fix the highlighted fields before saving.");
  }

  return (
    <form
      className="space-y-6 lg:space-y-8"
      onSubmit={form.handleSubmit(onSubmit, onInvalid)}
      noValidate
    >
      <div className="grid items-start gap-6 xl:grid-cols-2 xl:gap-8">
        <div className="space-y-6 lg:space-y-8">
      <FormSection
        title="Basics"
        description="A clear title and description help buyers understand the listing at a glance."
      >
        <Field
          label="Title"
          htmlFor="property-title"
          error={errors.title?.message}
          hint="At least 4 characters."
        >
          <Input
            id="property-title"
            placeholder="e.g. Skyline Residence — Dubai Marina"
            disabled={busy}
            {...form.register("title")}
          />
        </Field>
        <Field
          label="Description"
          htmlFor="property-description"
          error={errors.description?.message}
          hint="Highlight layout, finishes, and neighbourhood. At least 20 characters."
        >
          <Textarea
            id="property-description"
            rows={6}
            placeholder="Describe the property, standout features, and who it suits…"
            disabled={busy}
            className="min-h-36 rounded-2xl"
            {...form.register("description")}
          />
        </Field>
      </FormSection>

      <FormSection
        title="Location"
        description="Shown on the public listing and used for search filters."
      >
        <Field label="Street address" htmlFor="property-address" error={errors.address?.message}>
          <Input
            id="property-address"
            placeholder="Building, street, or neighbourhood"
            disabled={busy}
            {...form.register("address")}
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="City" htmlFor="property-city" error={errors.city?.message}>
            <Input
              id="property-city"
              placeholder="Dubai"
              disabled={busy}
              {...form.register("city")}
            />
          </Field>
          <Field label="Country" htmlFor="property-country" error={errors.country?.message}>
            <Input
              id="property-country"
              placeholder="United Arab Emirates"
              disabled={busy}
              {...form.register("country")}
            />
          </Field>
        </div>
      </FormSection>

      <FormSection
        title="Media"
        description="Lead with strong photos. The first image becomes the cover."
      >
        <Controller
          control={form.control}
          name="images"
          render={({ field }) => (
            <div className="space-y-2">
              <Label>Photos</Label>
              <PropertyImageManager
                images={field.value}
                onChange={field.onChange}
                uploadsEnabled={uploadsEnabled}
              />
              {errors.images?.message ? (
                <p className="text-sm text-destructive">{errors.images.message}</p>
              ) : (
                <p className="text-xs text-muted-foreground">Add at least one photo.</p>
              )}
            </div>
          )}
        />
        <Field
          label="Video URL"
          htmlFor="property-video"
          error={errors.videoUrl?.message}
          hint="Optional. YouTube, Vimeo, or a direct video link."
        >
          <Input
            id="property-video"
            type="url"
            placeholder="https://"
            disabled={busy}
            {...form.register("videoUrl")}
          />
        </Field>
      </FormSection>
        </div>

        <div className="space-y-6 lg:space-y-8">
      <FormSection
        title="Pricing & layout"
        description="Numbers buyers compare first — keep them accurate."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Price (USD)" htmlFor="property-price" error={errors.price?.message}>
            <Input
              id="property-price"
              type="number"
              min={1}
              step={1}
              placeholder="500000"
              disabled={busy}
              {...form.register("price", { valueAsNumber: true })}
            />
          </Field>
          <Field label="Purpose" error={errors.purpose?.message}>
            <Controller
              control={form.control}
              name="purpose"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange} disabled={busy}>
                  <SelectTrigger aria-label="Purpose">
                    <SelectValue placeholder="Select purpose" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sale">For sale</SelectItem>
                    <SelectItem value="rent">For rent</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Bedrooms" htmlFor="property-bedrooms" error={errors.bedrooms?.message}>
            <Input
              id="property-bedrooms"
              type="number"
              min={0}
              max={50}
              disabled={busy}
              {...form.register("bedrooms", { valueAsNumber: true })}
            />
          </Field>
          <Field label="Bathrooms" htmlFor="property-bathrooms" error={errors.bathrooms?.message}>
            <Input
              id="property-bathrooms"
              type="number"
              min={0}
              max={50}
              disabled={busy}
              {...form.register("bathrooms", { valueAsNumber: true })}
            />
          </Field>
          <Field label="Area (m²)" htmlFor="property-area" error={errors.areaSqm?.message}>
            <Input
              id="property-area"
              type="number"
              min={1}
              disabled={busy}
              {...form.register("areaSqm", { valueAsNumber: true })}
            />
          </Field>
        </div>
        <Controller
          control={form.control}
          name="furnished"
          render={({ field }) => (
            <div className="flex items-center justify-between gap-4 rounded-2xl border border-border/80 bg-muted/20 px-4 py-3.5">
              <div className="min-w-0">
                <p className="text-sm font-medium">Furnished</p>
                <p className="text-sm text-muted-foreground">
                  Shown as a filter facet in search results.
                </p>
              </div>
              <Switch
                checked={field.value}
                onCheckedChange={field.onChange}
                disabled={busy}
                aria-label="Furnished"
              />
            </div>
          )}
        />
      </FormSection>

      <FormSection
        title="Categorisation"
        description="Categories and amenities power discovery across the site."
      >
        <Controller
          control={form.control}
          name="categories"
          render={({ field }) => (
            <div className="space-y-2">
              <Label>Categories</Label>
              <div className="grid gap-2 sm:grid-cols-2">
                {PROPERTY_CATEGORIES.map((category) => {
                  const checked = field.value.includes(category);
                  return (
                    <label
                      key={category}
                      className={cn(
                        "flex cursor-pointer items-center gap-2.5 rounded-2xl border px-3 py-2.5 text-sm transition-colors",
                        checked
                          ? "border-primary/40 bg-primary/5"
                          : "border-border/80 hover:bg-muted/40",
                        busy && "pointer-events-none opacity-60"
                      )}
                    >
                      <Checkbox
                        checked={checked}
                        disabled={busy}
                        onCheckedChange={(next) =>
                          field.onChange(
                            next
                              ? [...field.value, category]
                              : field.value.filter((item) => item !== category)
                          )
                        }
                      />
                      {categoryLabel(category)}
                    </label>
                  );
                })}
              </div>
              {errors.categories?.message ? (
                <p className="text-sm text-destructive">{errors.categories.message}</p>
              ) : (
                <p className="text-xs text-muted-foreground">Select at least one category.</p>
              )}
            </div>
          )}
        />
        <Field
          label="Amenities"
          htmlFor="property-amenities"
          error={errors.amenities?.message}
          hint="Comma-separated, e.g. Pool, Gym, Concierge."
        >
          <Input
            id="property-amenities"
            placeholder="Pool, Gym, Concierge"
            disabled={busy}
            {...form.register("amenities")}
          />
        </Field>
        <Field
          label="Marketing badges"
          htmlFor="property-badges"
          error={errors.badges?.message}
          hint="Optional. Do not enter Verified — that comes from account approval."
        >
          <Input
            id="property-badges"
            placeholder="New, Exclusive, Luxury"
            disabled={busy}
            {...form.register("badges")}
          />
        </Field>
      </FormSection>
        </div>
      </div>

      <FormSection
        title="Viewing availability"
        description={
          variant === "seller"
            ? "Buyers book a generated slot inside these windows. Required before you submit for review."
            : "Optional. If you add windows, buyers pick a generated slot instead of proposing times freely."
        }
      >
        <Controller
          control={form.control}
          name="availabilityWindows"
          render={({ field }) => (
            <AvailabilityWindowsField
              value={field.value.length ? field.value : [emptyWindow()]}
              onChange={field.onChange}
              disabled={busy}
              required={variant === "seller"}
            />
          )}
        />
      </FormSection>

      <FormSection
        title="Publishing"
        description={
          canPublish
            ? "Choose whether this listing stays a draft, goes to review, or goes live."
            : "An admin publishes listings after review. You can save a draft or submit for review."
        }
      >
        <div className="max-w-md">
          <Controller
            control={form.control}
            name="status"
            render={({ field }) => (
              <Field label="Status" error={errors.status?.message}>
                <Select value={field.value} onValueChange={field.onChange} disabled={busy}>
                  <SelectTrigger aria-label="Listing status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="pending_review">Submit for review</SelectItem>
                    {canPublish ? <SelectItem value="published">Published</SelectItem> : null}
                  </SelectContent>
                </Select>
              </Field>
            )}
          />
        </div>
      </FormSection>

      <div className="sticky bottom-3 z-20 rounded-2xl border border-border/80 bg-background/95 p-3 shadow-[var(--shadow-card)] backdrop-blur-md sm:p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            {busy
              ? mode === "create"
                ? "Creating listing…"
                : "Saving changes…"
              : mode === "create"
                ? "Review the sections above, then create the listing."
                : "Changes apply after you save."}
          </p>
          <Button type="submit" className="rounded-full sm:min-w-40" disabled={busy} aria-busy={busy}>
            {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden /> : null}
            {mode === "create" ? "Create listing" : "Save changes"}
          </Button>
        </div>
      </div>
    </form>
  );
}

function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-border/70 bg-card/70 p-5 shadow-[var(--shadow-card)] sm:p-6 lg:p-7">
      <div className="space-y-1">
        <h2 className="text-base font-semibold tracking-tight sm:text-lg">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <Separator className="my-5" />
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function Field({
  label,
  htmlFor,
  error,
  hint,
  children,
}: {
  label: string;
  htmlFor?: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}
