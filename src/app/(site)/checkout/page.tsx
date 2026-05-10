"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SUBSCRIPTION_PLANS } from "@/data/plans";
import Link from "next/link";

const schema = z.object({
  plan: z.enum(["basic", "premium", "enterprise"]),
  cardName: z.string().min(2),
  email: z.string().email(),
});

type Values = z.infer<typeof schema>;

export default function CheckoutPage() {
  const [success, setSuccess] = useState(false);
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { plan: "premium", cardName: "", email: "" },
  });

  const planId = useWatch({ control: form.control, name: "plan" });
  const plan = SUBSCRIPTION_PLANS.find((p) => p.id === planId);

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-semibold tracking-tight">Checkout</h1>
      <p className="mt-2 text-muted-foreground">Agent subscription — demo flow without payment processor wiring.</p>

      {success ? (
        <Card className="mt-10 rounded-3xl">
          <CardContent className="p-10 text-center">
            <h2 className="text-xl font-semibold">Payment successful</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              A receipt was sent to {form.getValues("email")}. Upgrade limits instantly in the agent console.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button asChild className="rounded-full">
                <Link href="/agent/subscription">View subscription</Link>
              </Button>
              <Button asChild variant="outline" className="rounded-full">
                <Link href="/checkout/invoice">Download invoice</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="mt-10 rounded-3xl">
          <CardContent className="p-8">
            <form
              className="space-y-6"
              onSubmit={form.handleSubmit(() => {
                toast.success("Payment authorized (demo)");
                setSuccess(true);
              })}
            >
              <div className="space-y-2">
                <Label>Plan</Label>
                <div className="grid gap-3 sm:grid-cols-3">
                  {SUBSCRIPTION_PLANS.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => form.setValue("plan", p.id as Values["plan"])}
                      className={`rounded-2xl border px-4 py-3 text-left text-sm transition ${
                        planId === p.id ? "border-primary bg-primary/5" : "border-border hover:bg-muted/40"
                      }`}
                    >
                      <p className="font-semibold">{p.name}</p>
                      <p className="text-xs text-muted-foreground">${p.priceMonthly}/mo</p>
                    </button>
                  ))}
                </div>
              </div>
              {plan ? (
                <div className="rounded-2xl bg-muted/40 p-4 text-sm text-muted-foreground">
                  You selected <span className="font-medium text-foreground">{plan.name}</span> — listing cap:{" "}
                  {plan.listingLimit === "custom" ? "custom" : plan.listingLimit}.
                </div>
              ) : null}
              <div className="space-y-2">
                <Label htmlFor="email">Billing email</Label>
                <Input id="email" type="email" {...form.register("email")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cardName">Name on card</Label>
                <Input id="cardName" {...form.register("cardName")} />
              </div>
              <div className="rounded-2xl border border-dashed border-border p-4 text-xs text-muted-foreground">
                Card element placeholder — mount Stripe `PaymentElement` here in production.
              </div>
              <Button type="submit" className="w-full rounded-full">
                Pay securely
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
