"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { registerAction } from "@/server/actions/auth";

const schema = z
  .object({
    name: z.string().trim().min(2, "Enter your full name."),
    email: z.string().trim().email("Enter a valid email address."),
    password: z.string().min(8, "Use at least 8 characters."),
    confirm: z.string(),
  })
  .refine((values) => values.password === values.confirm, {
    path: ["confirm"],
    message: "Passwords do not match.",
  });

type Values = z.infer<typeof schema>;

export function RegisterForm() {
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") ?? undefined;
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", password: "", confirm: "" },
  });
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const errors = form.formState.errors;

  return (
    <Card className="glass-panel rounded-3xl border-white/20 shadow-[var(--shadow-soft)]">
      <CardHeader>
        <CardTitle className="text-2xl text-primary-foreground">Create your account</CardTitle>
        <CardDescription className="text-primary-foreground/70">
          Save homes, request viewings, and keep every reply in one place.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-4"
          noValidate
          onSubmit={form.handleSubmit((values) => {
            setError(null);
            startTransition(async () => {
              const result = await registerAction({
                name: values.name,
                email: values.email,
                password: values.password,
                callbackUrl,
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
            <Input
              id="name"
              autoComplete="name"
              aria-invalid={Boolean(errors.name)}
              className="bg-background/90"
              {...form.register("name")}
            />
            {errors.name ? (
              <p className="text-sm text-red-200">{errors.name.message}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="email" className="text-primary-foreground">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              aria-invalid={Boolean(errors.email)}
              className="bg-background/90"
              {...form.register("email")}
            />
            {errors.email ? (
              <p className="text-sm text-red-200">{errors.email.message}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-primary-foreground">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              aria-invalid={Boolean(errors.password)}
              className="bg-background/90"
              {...form.register("password")}
            />
            {errors.password ? (
              <p className="text-sm text-red-200">{errors.password.message}</p>
            ) : (
              <p className="text-xs text-primary-foreground/60">At least 8 characters.</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm" className="text-primary-foreground">
              Confirm password
            </Label>
            <Input
              id="confirm"
              type="password"
              autoComplete="new-password"
              aria-invalid={Boolean(errors.confirm)}
              className="bg-background/90"
              {...form.register("confirm")}
            />
            {errors.confirm ? (
              <p className="text-sm text-red-200">{errors.confirm.message}</p>
            ) : null}
          </div>
          {error ? <p className="text-sm text-red-200">{error}</p> : null}
          <Button type="submit" className="w-full rounded-full" disabled={pending}>
            {pending ? "Creating…" : "Create account"}
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-primary-foreground/80">
          Selling a property you own?{" "}
          <Link
            href="/auth/register/seller"
            className="font-semibold text-primary-foreground underline-offset-4 hover:underline"
          >
            Seller signup
          </Link>
          {" · "}
          <Link
            href="/for-brokers"
            className="font-semibold text-primary-foreground underline-offset-4 hover:underline"
          >
            Broker
          </Link>
          {" · "}
          <Link
            href="/for-agencies"
            className="font-semibold text-primary-foreground underline-offset-4 hover:underline"
          >
            Agency
          </Link>
        </p>
        <p className="mt-2 text-center text-sm text-primary-foreground/80">
          Already have an account?{" "}
          <Link
            href={`/auth/login${callbackUrl ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ""}`}
            className="font-semibold text-primary-foreground underline-offset-4 hover:underline"
          >
            Sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
