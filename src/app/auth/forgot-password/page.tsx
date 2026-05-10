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

const schema = z.object({ email: z.string().email() });

type Values = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const form = useForm<Values>({ resolver: zodResolver(schema) });

  return (
    <Card className="glass-panel rounded-3xl border-white/20 shadow-[var(--shadow-soft)]">
      <CardHeader>
        <CardTitle className="text-2xl text-primary-foreground">Reset access</CardTitle>
        <CardDescription className="text-primary-foreground/70">
          We’ll email a secure link — same deliverability stack as transactional visit updates.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={form.handleSubmit(() => toast.success("Reset link sent (demo)"))}>
          <div className="space-y-2">
            <Label htmlFor="email" className="text-primary-foreground">
              Email
            </Label>
            <Input id="email" type="email" className="bg-background/90" {...form.register("email")} />
          </div>
          <Button type="submit" className="w-full rounded-full">
            Send reset link
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-primary-foreground/80">
          <Link href="/auth/login" className="underline-offset-4 hover:underline">
            Back to sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
