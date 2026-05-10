"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

type Values = z.infer<typeof schema>;

export default function LoginPage() {
  const form = useForm<Values>({ resolver: zodResolver(schema) });

  return (
    <Card className="glass-panel rounded-3xl border-white/20 shadow-[var(--shadow-soft)]">
      <CardHeader>
        <CardTitle className="text-2xl text-primary-foreground">Welcome back</CardTitle>
        <CardDescription className="text-primary-foreground/70">
          Sign in to manage visits, saved homes, and agent tools.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-4"
          onSubmit={form.handleSubmit(() => toast.success("Signed in (demo)"))}
        >
          <div className="space-y-2">
            <Label htmlFor="email" className="text-primary-foreground">
              Email
            </Label>
            <Input id="email" type="email" className="bg-background/90" {...form.register("email")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-primary-foreground">
              Password
            </Label>
            <Input id="password" type="password" className="bg-background/90" {...form.register("password")} />
          </div>
          <Button type="submit" className="w-full rounded-full">
            Continue
          </Button>
        </form>
        <Separator className="my-6 bg-white/15" />
        <div className="grid gap-3">
          <Button type="button" variant="outline" className="rounded-full bg-background/80">
            Continue with Google
          </Button>
          <Button type="button" variant="outline" className="rounded-full bg-background/80">
            Continue with Apple
          </Button>
        </div>
        <p className="mt-6 text-center text-sm text-primary-foreground/80">
          New here?{" "}
          <Link href="/auth/register" className="font-semibold text-primary-foreground underline-offset-4 hover:underline">
            Create an account
          </Link>
        </p>
        <p className="mt-3 text-center text-xs text-primary-foreground/70">
          <Link href="/auth/forgot-password">Forgot password</Link>
        </p>
      </CardContent>
    </Card>
  );
}
