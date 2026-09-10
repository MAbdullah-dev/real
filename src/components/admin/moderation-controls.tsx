"use client";

import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  moderatePropertyAction,
  setAdminSettingAction,
  setAgentVerifiedAction,
  setUserRoleAction,
} from "@/server/actions/admin";

export function PropertyModerationControls({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();

  function update(next: "published" | "rejected" | "pending_review") {
    startTransition(async () => {
      const result = await moderatePropertyAction({ id, status: next });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Listing updated");
      router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap justify-end gap-2">
      {status !== "published" ? (
        <Button
          size="sm"
          className="rounded-full"
          disabled={pending}
          onClick={() => update("published")}
        >
          Publish
        </Button>
      ) : (
        <Button
          size="sm"
          variant="outline"
          className="rounded-full"
          disabled={pending}
          onClick={() => update("pending_review")}
        >
          Unpublish
        </Button>
      )}
      {status !== "rejected" ? (
        <Button
          size="sm"
          variant="ghost"
          className="rounded-full"
          disabled={pending}
          onClick={() => update("rejected")}
        >
          Reject
        </Button>
      ) : null}
    </div>
  );
}

export function UserRoleSelect({
  userId,
  role,
}: {
  userId: string;
  role: "USER" | "AGENT" | "ADMIN";
}) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();

  return (
    <Select
      value={role}
      disabled={pending}
      onValueChange={(next) =>
        startTransition(async () => {
          const result = await setUserRoleAction({
            userId,
            role: next as "USER" | "AGENT" | "ADMIN",
          });
          if (result.error) {
            toast.error(result.error);
            return;
          }
          toast.success("Role updated");
          router.refresh();
        })
      }
    >
      <SelectTrigger className="h-9 w-32">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="USER">Guest</SelectItem>
        <SelectItem value="AGENT">Agent</SelectItem>
        <SelectItem value="ADMIN">Admin</SelectItem>
      </SelectContent>
    </Select>
  );
}

export function AgentVerifiedSwitch({
  userId,
  verified,
}: {
  userId: string;
  verified: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();

  return (
    <Switch
      checked={verified}
      disabled={pending}
      aria-label="Verified agent"
      onCheckedChange={(next) =>
        startTransition(async () => {
          const result = await setAgentVerifiedAction(userId, next);
          if (result.error) {
            toast.error(result.error);
            return;
          }
          router.refresh();
        })
      }
    />
  );
}

export function AdminSettingSwitch({
  settingKey,
  value,
}: {
  settingKey: string;
  value: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();

  return (
    <Switch
      checked={value}
      disabled={pending}
      onCheckedChange={(next) =>
        startTransition(async () => {
          const result = await setAdminSettingAction(settingKey, next);
          if (result.error) {
            toast.error(result.error);
            return;
          }
          toast.success("Setting saved");
          router.refresh();
        })
      }
    />
  );
}
