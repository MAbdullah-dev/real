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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  createBrokerPropertyAction,
  createPropertyAction,
  createSellerPropertyAction,
  updateBrokerPropertyAction,
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
  variant?: "agency" | "broker" | "seller";
}) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const form = useForm<PropertyFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const { errors } = form.formState;

  function onSubmit(values: PropertyFormValues) {
    startTransition(async () => {
      const payload = { ...values, videoUrl: values.videoUrl.trim() || undefined };
      const result =
        mode === "create"
          ? variant === "seller"
            ? await createSellerPropertyAction(payload)
            : variant === "broker"
              ? await createBrokerPropertyAction(payload)
              : await createPropertyAction(payload)
          : variant === "seller"
            ? await updateSellerPropertyAction(propertyId!, payload)
            : variant === "broker"
              ? await updateBrokerPropertyAction(propertyId!, payload)
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

  return (
    <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
      <Card className="rounded-3xl">
        <CardHeader>
          <CardTitle>Core details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field label="Title" error={errors.title?.message}>
            <Input {...form.register("title")} />
          </Field>
          <Field label="Description" error={errors.description?.message}>
            <Textarea rows={6} {...form.register("description")} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Address" error={errors.address?.message}>
              <Input {...form.register("address")} />
            </Field>
            <Field label="City" error={errors.city?.message}>
              <Input {...form.register("city")} />
            </Field>
            <Field label="Country" error={errors.country?.message}>
              <Input {...form.register("country")} />
            </Field>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-3xl">
        <CardHeader>
          <CardTitle>Pricing & layout</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Price (USD)" error={errors.price?.message}>
              <Input type="number" {...form.register("price", { valueAsNumber: true })} />
            </Field>
            <Field label="Purpose" error={errors.purpose?.message}>
              <Controller
                control={form.control}
                name="purpose"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
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
            <Field label="Bedrooms" error={errors.bedrooms?.message}>
              <Input type="number" {...form.register("bedrooms", { valueAsNumber: true })} />
            </Field>
            <Field label="Bathrooms" error={errors.bathrooms?.message}>
              <Input type="number" {...form.register("bathrooms", { valueAsNumber: true })} />
            </Field>
            <Field label="Area (m²)" error={errors.areaSqm?.message}>
              <Input type="number" {...form.register("areaSqm", { valueAsNumber: true })} />
            </Field>
          </div>
          <Controller
            control={form.control}
            name="furnished"
            render={({ field }) => (
              <div className="flex items-center justify-between rounded-2xl border border-border p-4">
                <div>
                  <p className="text-sm font-medium">Furnished</p>
                  <p className="text-sm text-muted-foreground">Shown as a filter facet in search.</p>
                </div>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </div>
            )}
          />
        </CardContent>
      </Card>

      <Card className="rounded-3xl">
        <CardHeader>
          <CardTitle>Gallery</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Controller
            control={form.control}
            name="images"
            render={({ field }) => (
              <PropertyImageManager
                images={field.value}
                onChange={field.onChange}
                uploadsEnabled={uploadsEnabled}
              />
            )}
          />
          {errors.images?.message ? (
            <p className="text-sm text-destructive">{errors.images.message}</p>
          ) : null}
          <Field label="Video URL (optional)" error={errors.videoUrl?.message}>
            <Input placeholder="https://…" {...form.register("videoUrl")} />
          </Field>
        </CardContent>
      </Card>

      <Card className="rounded-3xl">
        <CardHeader>
          <CardTitle>Categorisation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Controller
            control={form.control}
            name="categories"
            render={({ field }) => (
              <div className="space-y-2">
                <Label>Categories</Label>
                <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-4">
                  {PROPERTY_CATEGORIES.map((category) => {
                    const checked = field.value.includes(category);
                    return (
                      <label
                        key={category}
                        className="flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm"
                      >
                        <Checkbox
                          checked={checked}
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
                ) : null}
              </div>
            )}
          />
          <Field label="Amenities (comma separated)" error={errors.amenities?.message}>
            <Input placeholder="Pool, Gym, Concierge" {...form.register("amenities")} />
          </Field>
          <Field label="Badges (comma separated)" error={errors.badges?.message}>
            <Input placeholder="New, Exclusive" {...form.register("badges")} />
          </Field>
        </CardContent>
      </Card>

      <Card className="rounded-3xl">
        <CardHeader>
          <CardTitle>Publishing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Controller
            control={form.control}
            name="status"
            render={({ field }) => (
              <Field label="Status" error={errors.status?.message}>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue />
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
          {!canPublish ? (
            <p className="text-sm text-muted-foreground">
              An admin publishes listings after review.
            </p>
          ) : null}
          <Button type="submit" className="rounded-full" disabled={pending}>
            {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {mode === "create" ? "Create listing" : "Save changes"}
          </Button>
        </CardContent>
      </Card>
    </form>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
