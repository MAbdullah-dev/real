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

const schema = z.object({ code: z.string().length(6, "Enter the 6-digit code") });

type Values = z.infer<typeof schema>;

export default function VerifyOtpPage() {
  const form = useForm<Values>({ resolver: zodResolver(schema) });

  return (
    <Card className="glass-panel rounded-3xl border-white/20 shadow-[var(--shadow-soft)]">
      <CardHeader>
        <CardTitle className="text-2xl text-primary-foreground">Verify OTP</CardTitle>
        <CardDescription className="text-primary-foreground/70">
          Enter the code we sent — expires in 10 minutes for security.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={form.handleSubmit(() => toast.success("Verified (demo)"))}>
          <div className="space-y-2">
            <Label htmlFor="code" className="text-primary-foreground">
              One-time code
            </Label>
            <Input id="code" inputMode="numeric" className="bg-background/90 tracking-[0.4em]" {...form.register("code")} />
          </div>
          <Button type="submit" className="w-full rounded-full">
            Verify & continue
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-primary-foreground/80">
          Wrong inbox?{" "}
          <Link href="/auth/register" className="underline-offset-4 hover:underline">
            Resend
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
