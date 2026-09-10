"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { sendContactMessageAction } from "@/server/actions/contact";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  company: z.string().optional(),
  message: z.string().min(10),
});

type Values = z.infer<typeof schema>;

export default function ContactPage() {
  const [pending, startTransition] = useTransition();
  const form = useForm<Values>({ resolver: zodResolver(schema) });

  function onSubmit(values: Values) {
    startTransition(async () => {
      const result = await sendContactMessageAction(values);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Message sent", { description: "Our team will reply shortly." });
      form.reset();
    });
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-semibold tracking-tight">Concierge contact</h1>
      <p className="mt-4 text-muted-foreground">
        Partnerships, press, and white-glove buyer introductions — we respond within one business day.
      </p>
      <Card className="mt-10 rounded-3xl">
        <CardContent className="p-8">
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" {...form.register("name")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" {...form.register("email")} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">Company (optional)</Label>
              <Input id="company" {...form.register("company")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">How can we help?</Label>
              <Textarea id="message" {...form.register("message")} />
            </div>
            <Button type="submit" className="rounded-full" disabled={pending}>
              {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Send message
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
