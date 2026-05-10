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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
});

type Values = z.infer<typeof schema>;

export default function RegisterPage() {
  const guest = useForm<Values>({ resolver: zodResolver(schema) });
  const agent = useForm<Values>({ resolver: zodResolver(schema) });

  return (
    <Card className="glass-panel rounded-3xl border-white/20 shadow-[var(--shadow-soft)]">
      <CardHeader>
        <CardTitle className="text-2xl text-primary-foreground">Create your workspace</CardTitle>
        <CardDescription className="text-primary-foreground/70">
          Guest accounts for visits, or agent accounts with subscription onboarding.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="guest">
          <TabsList className="w-full bg-background/40">
            <TabsTrigger value="guest" className="flex-1">
              Guest
            </TabsTrigger>
            <TabsTrigger value="agent" className="flex-1">
              Agent
            </TabsTrigger>
          </TabsList>
          <TabsContent value="guest">
            <form
              className="mt-4 space-y-4"
              onSubmit={guest.handleSubmit(() => toast.success("Account created (demo)"))}
            >
              <div className="space-y-2">
                <Label htmlFor="g-name" className="text-primary-foreground">
                  Name
                </Label>
                <Input id="g-name" className="bg-background/90" {...guest.register("name")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="g-email" className="text-primary-foreground">
                  Email
                </Label>
                <Input id="g-email" type="email" className="bg-background/90" {...guest.register("email")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="g-password" className="text-primary-foreground">
                  Password
                </Label>
                <Input id="g-password" type="password" className="bg-background/90" {...guest.register("password")} />
              </div>
              <Button type="submit" className="w-full rounded-full">
                Continue
              </Button>
            </form>
          </TabsContent>
          <TabsContent value="agent">
            <form
              className="mt-4 space-y-4"
              onSubmit={agent.handleSubmit(() => {
                toast.success("Check your inbox for verification");
              })}
            >
              <div className="space-y-2">
                <Label htmlFor="a-name" className="text-primary-foreground">
                  Name
                </Label>
                <Input id="a-name" className="bg-background/90" {...agent.register("name")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="a-email" className="text-primary-foreground">
                  Work email
                </Label>
                <Input id="a-email" type="email" className="bg-background/90" {...agent.register("email")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="a-password" className="text-primary-foreground">
                  Password
                </Label>
                <Input id="a-password" type="password" className="bg-background/90" {...agent.register("password")} />
              </div>
              <Button type="submit" className="w-full rounded-full">
                Start agent onboarding
              </Button>
              <p className="text-center text-xs text-primary-foreground/70">
                You’ll verify OTP, then select a listing plan.
              </p>
            </form>
          </TabsContent>
        </Tabs>
        <p className="mt-6 text-center text-sm text-primary-foreground/80">
          Already have an account?{" "}
          <Link href="/auth/login" className="font-semibold text-primary-foreground underline-offset-4 hover:underline">
            Sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
