"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarClock, Share2, ShieldCheck } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { formatPrice } from "@/lib/utils";
import type { Property } from "@/types";

const bookingSchema = z.object({
  name: z.string().min(2, "Please add your name"),
  email: z.string().email(),
  phone: z.string().min(6),
  message: z.string().min(8, "Share timing preferences or questions"),
});

type BookingValues = z.infer<typeof bookingSchema>;

export function PropertyStickyPanel({ property }: { property: Property }) {
  const priceLabel =
    property.purpose === "rent"
      ? `${formatPrice(property.price)}/mo`
      : formatPrice(property.price);

  const form = useForm<BookingValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: { name: "", email: "", phone: "", message: "" },
  });

  return (
    <div className="space-y-6 lg:sticky lg:top-24">
      <Card className="rounded-3xl border-border/80 shadow-[var(--shadow-soft)]">
        <CardContent className="p-6 sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {property.purpose === "rent" ? "Monthly lease" : "Asking price"}
              </p>
              <p className="mt-2 text-3xl font-semibold tabular-nums">{priceLabel}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Human-confirmed scheduling · not instant booking
              </p>
            </div>
            <Button type="button" size="icon" variant="outline" className="rounded-full shrink-0">
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
          <Separator className="my-6" />
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={property.agentAvatar} alt={property.agentName} />
              <AvatarFallback>{property.agentName.slice(0, 2)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-semibold">{property.agentName}</p>
              <p className="text-xs text-muted-foreground">Listing director</p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs">
              <ShieldCheck className="h-3.5 w-3.5 text-primary" />
              Verified agent
            </span>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <Button asChild className="rounded-full">
              <a href={`tel:+15550000000`}>Call concierge</a>
            </Button>
            <Button asChild variant="outline" className="rounded-full">
              <a href={`mailto:concierge@estate-elite.com`}>Email team</a>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-3xl border-border/80">
        <CardContent className="p-6 sm:p-8">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <CalendarClock className="h-4 w-4 text-primary" />
            Request a private visit
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Share your ideal windows — we coordinate with the listing desk and confirm by phone.
          </p>
          <form
            className="mt-6 space-y-4"
            onSubmit={form.handleSubmit(() => {
              toast.success("Request received", {
                description: "Our concierge team will call to confirm your visit window.",
              });
              form.reset();
            })}
          >
            <div className="space-y-2">
              <Label htmlFor="name">Full name</Label>
              <Input id="name" {...form.register("name")} />
              {form.formState.errors.name ? (
                <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
              ) : null}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" {...form.register("email")} />
                {form.formState.errors.email ? (
                  <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" {...form.register("phone")} />
                {form.formState.errors.phone ? (
                  <p className="text-xs text-destructive">{form.formState.errors.phone.message}</p>
                ) : null}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Visit goals</Label>
              <Textarea id="message" {...form.register("message")} />
              {form.formState.errors.message ? (
                <p className="text-xs text-destructive">{form.formState.errors.message.message}</p>
              ) : null}
            </div>
            <Button type="submit" className="w-full rounded-full" disabled={form.formState.isSubmitting}>
              Submit booking request
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
