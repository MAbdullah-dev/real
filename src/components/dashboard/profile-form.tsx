"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateProfileAction } from "@/server/actions/profile";

const schema = z.object({
  name: z.string().min(2, "Enter your name."),
  image: z.string(),
});

type Values = z.infer<typeof schema>;

export function ProfileForm({
  defaultValues,
  email,
}: {
  defaultValues: Values;
  email: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues });

  return (
    <form
      className="space-y-4"
      onSubmit={form.handleSubmit((values) =>
        startTransition(async () => {
          const result = await updateProfileAction(values);
          if (result.error) {
            toast.error(result.error);
            return;
          }
          toast.success("Profile saved");
          router.refresh();
        })
      )}
    >
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" {...form.register("name")} />
        {form.formState.errors.name ? (
          <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
        ) : null}
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" value={email} readOnly disabled />
        <p className="text-xs text-muted-foreground">
          Email is tied to your sign-in and cannot be changed here.
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="image">Avatar URL</Label>
        <Input id="image" placeholder="https://…" {...form.register("image")} />
      </div>
      <Button type="submit" className="rounded-full" disabled={pending}>
        {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        Save
      </Button>
    </form>
  );
}
