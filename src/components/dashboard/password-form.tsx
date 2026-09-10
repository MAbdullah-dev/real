"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import * as React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { changePasswordAction } from "@/server/actions/profile";

const schema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password."),
    newPassword: z.string().min(8, "Use at least 8 characters."),
    confirmPassword: z.string(),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    message: "New passwords do not match.",
    path: ["confirmPassword"],
  });

type Values = z.infer<typeof schema>;

export function PasswordForm() {
  const [pending, startTransition] = React.useTransition();
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  return (
    <form
      className="space-y-4"
      onSubmit={form.handleSubmit((values) =>
        startTransition(async () => {
          const result = await changePasswordAction(values);
          if (result.error) {
            toast.error(result.error);
            return;
          }
          toast.success("Password updated");
          form.reset();
        })
      )}
    >
      {(
        [
          ["currentPassword", "Current password"],
          ["newPassword", "New password"],
          ["confirmPassword", "Confirm new password"],
        ] as const
      ).map(([field, label]) => (
        <div key={field} className="space-y-2">
          <Label htmlFor={field}>{label}</Label>
          <Input id={field} type="password" {...form.register(field)} />
          {form.formState.errors[field] ? (
            <p className="text-sm text-destructive">{form.formState.errors[field]?.message}</p>
          ) : null}
        </div>
      ))}
      <Button type="submit" className="rounded-full" disabled={pending}>
        {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        Update password
      </Button>
    </form>
  );
}
