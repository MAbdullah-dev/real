"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { registerAction } from "@/server/actions/auth";

const schema = z.object({
  name: z.string().min(2, "Enter your full name."),
  email: z.string().email(),
  phone: z.string().min(6, "Enter a reachable phone number."),
  password: z.string().min(8, "Use at least 8 characters."),
  acceptTerms: z.boolean().refine((v) => v === true, "Accept the terms to continue."),
});

type Values = z.infer<typeof schema>;

export default function SellerRegisterPage() {
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { acceptTerms: undefined as unknown as true },
  });
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <Card className="glass-panel rounded-3xl border-white/20 shadow-[var(--shadow-soft)]">
      <CardHeader>
        <CardTitle className="text-2xl text-primary-foreground">Sell your property</CardTitle>
        <CardDescription className="text-primary-foreground/70">
          Create a seller account to list a home you own. Brokers and agencies use a different
          signup.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-4"
          onSubmit={form.handleSubmit((values) => {
            setError(null);
            startTransition(async () => {
              const result = await registerAction({
                name: values.name,
                email: values.email,
                password: values.password,
                phone: values.phone,
                asSeller: true,
                acceptTerms: values.acceptTerms,
              });
              if (result.error) {
                setError(result.error);
                toast.error(result.error);
              }
            });
          })}
        >
          <div className="space-y-2">
            <Label htmlFor="name" className="text-primary-foreground">
              Full name
            </Label>
            <Input id="name" className="bg-background/90" {...form.register("name")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email" className="text-primary-foreground">
              Email
            </Label>
            <Input id="email" type="email" className="bg-background/90" {...form.register("email")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone" className="text-primary-foreground">
              Phone
            </Label>
            <Input id="phone" className="bg-background/90" {...form.register("phone")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-primary-foreground">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              className="bg-background/90"
              {...form.register("password")}
            />
          </div>
          <label className="flex items-start gap-2 text-sm text-primary-foreground/80">
            <input type="checkbox" className="mt-1" {...form.register("acceptTerms")} />
            I own this property (or have authority to list it) and accept the terms.
          </label>
          {error ? <p className="text-sm text-red-200">{error}</p> : null}
          <Button type="submit" className="w-full rounded-full" disabled={pending}>
            {pending ? "Creating…" : "Continue"}
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-primary-foreground/80">
          Are you a broker?{" "}
          <Link href="/auth/register/broker" className="underline">
            Broker signup
          </Link>
          {" · "}
          Agency?{" "}
          <Link href="/auth/register/agency" className="underline">
            Agency signup
          </Link>
        </p>
        <p className="mt-2 text-center text-sm text-primary-foreground/80">
          Just browsing?{" "}
          <Link href="/auth/register" className="underline">
            Create a buyer account
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
