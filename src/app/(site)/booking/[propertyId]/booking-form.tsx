"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarRange, CheckCircle2, Loader2 } from "lucide-react";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { createBookingAction } from "@/server/actions/bookings";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Property } from "@/types";
import Link from "next/link";

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(6),
  dates: z.string().min(3, "Share ideal dates"),
  notes: z.string().min(6),
});

type Values = z.infer<typeof schema>;

export function BookingForm({ property }: { property: Property }) {
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();
  const form = useForm<Values>({ resolver: zodResolver(schema) });

  function onSubmit(values: Values) {
    startTransition(async () => {
      const result = await createBookingAction({
        propertyId: property.id,
        name: values.name,
        email: values.email,
        phone: values.phone,
        requestedDates: values.dates,
        notes: values.notes,
      });

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Booking request sent");
      setDone(true);
    });
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/40 px-3 py-1 text-xs font-medium">
        <CalendarRange className="h-3.5 w-3.5" />
        Concierge booking · not instant confirmation
      </div>
      <h1 className="mt-6 text-3xl font-semibold tracking-tight">Schedule a visit</h1>
      <p className="mt-2 text-muted-foreground">{property.title}</p>

      {done ? (
        <Card className="mt-10 rounded-3xl border-primary/30">
          <CardContent className="flex flex-col items-center p-10 text-center">
            <CheckCircle2 className="h-12 w-12 text-primary" />
            <h2 className="mt-4 text-xl font-semibold">Request captured</h2>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              Our team will call {form.getValues("phone")} to confirm the visit window and share arrival details.
            </p>
            <Button asChild className="mt-8 rounded-full">
              <Link href="/dashboard/bookings">View booking requests</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="mt-10 rounded-3xl">
          <CardContent className="p-8">
            <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Full name</Label>
                  <Input id="name" {...form.register("name")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" {...form.register("email")} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" {...form.register("phone")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dates">Ideal dates / windows</Label>
                <Input id="dates" placeholder="e.g. Apr 20–24 mornings" {...form.register("dates")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Context</Label>
                <Textarea id="notes" {...form.register("notes")} />
              </div>
              <Button type="submit" className="rounded-full" disabled={pending}>
                {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Submit request
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
