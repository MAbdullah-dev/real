"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  saveBrokerProfileAction,
  submitBrokerForReviewAction,
} from "@/server/actions/broker-onboarding";

const schema = z.object({
  phone: z.string().min(6),
  country: z.string().length(2),
  city: z.string().min(2),
  title: z.string().max(80).optional(),
  bio: z.string().max(2000).optional(),
  whatsapp: z.string().max(40).optional(),
});

type Values = z.infer<typeof schema>;

export function BrokerProfileForm({
  defaults,
  canSubmitReview,
}: {
  defaults: Values;
  canSubmitReview: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: defaults,
  });

  return (
    <Card className="rounded-3xl">
      <CardHeader>
        <CardTitle>Broker profile</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-4"
          onSubmit={form.handleSubmit((values) => {
            setError(null);
            startTransition(async () => {
              const saved = await saveBrokerProfileAction(values);
              if (saved.error) {
                setError(saved.error);
                toast.error(saved.error);
                return;
              }
              toast.success("Profile saved");
              router.refresh();
            });
          })}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" {...form.register("phone")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="whatsapp">WhatsApp</Label>
              <Input id="whatsapp" {...form.register("whatsapp")} />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="country">Country (ISO)</Label>
              <Input id="country" placeholder="PK" {...form.register("country")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input id="city" {...form.register("city")} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" placeholder="Independent broker" {...form.register("title")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bio">About your work</Label>
            <Textarea id="bio" className="min-h-24" {...form.register("bio")} />
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <div className="flex flex-wrap gap-3">
            <Button type="submit" className="rounded-full" disabled={pending}>
              {pending ? "Saving…" : "Save profile"}
            </Button>
            {canSubmitReview ? (
              <Button
                type="button"
                variant="outline"
                className="rounded-full"
                disabled={pending}
                onClick={() =>
                  startTransition(async () => {
                    const result = await submitBrokerForReviewAction();
                    if (result.error) {
                      toast.error(result.error);
                      return;
                    }
                    toast.success("Submitted for review");
                    router.push("/broker");
                    router.refresh();
                  })
                }
              >
                Submit for review
              </Button>
            ) : null}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
