"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";

const profileSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
});

type Profile = z.infer<typeof profileSchema>;

export default function UserSettingsPage() {
  const form = useForm<Profile>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: "Guest user", email: "you@example.com" },
  });

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-2 text-sm text-muted-foreground">Profile, security, and billing preferences.</p>
      </div>
      <Card className="rounded-3xl">
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-4"
            onSubmit={form.handleSubmit(() => toast.success("Profile saved (demo)"))}
          >
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" {...form.register("name")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...form.register("email")} />
            </div>
            <Button type="submit" className="rounded-full">
              Save
            </Button>
          </form>
        </CardContent>
      </Card>
      <Card className="rounded-3xl">
        <CardHeader>
          <CardTitle>Security</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-medium">Two-factor authentication</p>
              <p className="text-muted-foreground">Protect high-value booking actions.</p>
            </div>
            <Switch />
          </div>
          <Separator />
          <Button variant="outline" className="rounded-full">
            Change password
          </Button>
        </CardContent>
      </Card>
      <Card className="rounded-3xl">
        <CardHeader>
          <CardTitle>Payment history</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Stripe CustomerPortal deep link mounts here for visit fees and concierge retainers.
        </CardContent>
      </Card>
    </div>
  );
}
