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
import { Textarea } from "@/components/ui/textarea";
import { updateAgentProfileAction } from "@/server/actions/profile";

const schema = z.object({
  agency: z.string().min(2, "Enter your agency name."),
  phone: z.string().min(6, "Enter an operations phone number."),
  bio: z.string().min(20, "Write at least a short introduction."),
});

type Values = z.infer<typeof schema>;

export function AgentProfileForm({ defaultValues }: { defaultValues: Values }) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues });

  return (
    <form
      className="space-y-4"
      onSubmit={form.handleSubmit((values) =>
        startTransition(async () => {
          const result = await updateAgentProfileAction(values);
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
        <Label htmlFor="agency">Agency name</Label>
        <Input id="agency" {...form.register("agency")} />
        {form.formState.errors.agency ? (
          <p className="text-sm text-destructive">{form.formState.errors.agency.message}</p>
        ) : null}
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone">Operations phone</Label>
        <Input id="phone" {...form.register("phone")} />
        {form.formState.errors.phone ? (
          <p className="text-sm text-destructive">{form.formState.errors.phone.message}</p>
        ) : null}
      </div>
      <div className="space-y-2">
        <Label htmlFor="bio">Public bio</Label>
        <Textarea id="bio" rows={5} {...form.register("bio")} />
        {form.formState.errors.bio ? (
          <p className="text-sm text-destructive">{form.formState.errors.bio.message}</p>
        ) : null}
      </div>
      <Button type="submit" className="rounded-full" disabled={pending}>
        {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        Save
      </Button>
    </form>
  );
}
