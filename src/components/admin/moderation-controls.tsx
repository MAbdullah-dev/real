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
import { Textarea } from "@/components/ui/textarea";
import {
  moderatePropertyAction,
  reviewCredentialAction,
  setAdminSettingAction,
  setAgencyStatusAction,
  setBrokerStatusAction,
  setSellerStatusAction,
  setUserRoleAction,
} from "@/server/actions/admin";
import { CREDENTIAL_LABELS } from "@/lib/agency-labels";

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
  role: "USER" | "SELLER" | "BROKER" | "AGENCY" | "ADMIN";
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
            role: next as "USER" | "SELLER" | "BROKER" | "AGENCY" | "ADMIN",
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
      <SelectTrigger className="h-9 w-36">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="USER">Buyer</SelectItem>
        <SelectItem value="SELLER">Seller</SelectItem>
        <SelectItem value="BROKER">Broker</SelectItem>
        <SelectItem value="AGENCY">Agency</SelectItem>
        <SelectItem value="ADMIN">Admin</SelectItem>
      </SelectContent>
    </Select>
  );
}

export function AgencyStatusControls({
  agencyId,
  status,
}: {
  agencyId: string;
  status: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [note, setNote] = React.useState("");

  function run(next: "active" | "rejected" | "suspended" | "pending_review") {
    startTransition(async () => {
      const result = await setAgencyStatusAction({
        agencyId,
        status: next,
        statusNote: note || undefined,
      });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Agency updated");
      setNote("");
      router.refresh();
    });
  }

  return (
    <div className="space-y-2">
      <Textarea
        placeholder="Note (required to reject)"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        className="min-h-16 text-sm"
      />
      <div className="flex flex-wrap justify-end gap-2">
        {status !== "active" ? (
          <Button size="sm" className="rounded-full" disabled={pending} onClick={() => run("active")}>
            Approve
          </Button>
        ) : null}
        <Button
          size="sm"
          variant="outline"
          className="rounded-full"
          disabled={pending}
          onClick={() => run("rejected")}
        >
          Reject
        </Button>
        {status !== "suspended" ? (
          <Button
            size="sm"
            variant="ghost"
            className="rounded-full"
            disabled={pending}
            onClick={() => run("suspended")}
          >
            Suspend
          </Button>
        ) : null}
      </div>
    </div>
  );
}

export function BrokerStatusControls({
  userId,
  status,
}: {
  userId: string;
  status: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [note, setNote] = React.useState("");

  function run(next: "active" | "rejected" | "suspended" | "pending_review") {
    startTransition(async () => {
      const result = await setBrokerStatusAction({
        userId,
        status: next,
        statusNote: note || undefined,
      });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Broker updated");
      setNote("");
      router.refresh();
    });
  }

  return (
    <div className="space-y-2">
      <Textarea
        placeholder="Note (required to reject)"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        className="min-h-16 text-sm"
      />
      <div className="flex flex-wrap justify-end gap-2">
        {status !== "active" ? (
          <Button size="sm" className="rounded-full" disabled={pending} onClick={() => run("active")}>
            Approve
          </Button>
        ) : null}
        <Button
          size="sm"
          variant="outline"
          className="rounded-full"
          disabled={pending}
          onClick={() => run("rejected")}
        >
          Reject
        </Button>
        {status !== "suspended" ? (
          <Button
            size="sm"
            variant="ghost"
            className="rounded-full"
            disabled={pending}
            onClick={() => run("suspended")}
          >
            Suspend
          </Button>
        ) : null}
      </div>
    </div>
  );
}

export function SellerStatusControls({
  userId,
  status,
}: {
  userId: string;
  status: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [note, setNote] = React.useState("");

  function run(next: "active" | "rejected" | "suspended" | "pending_review") {
    startTransition(async () => {
      const result = await setSellerStatusAction({
        userId,
        status: next,
        statusNote: note || undefined,
      });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Seller updated");
      setNote("");
      router.refresh();
    });
  }

  return (
    <div className="space-y-2">
      <Textarea
        placeholder="Note (required to reject)"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        className="min-h-16 text-sm"
      />
      <div className="flex flex-wrap justify-end gap-2">
        {status !== "active" ? (
          <Button size="sm" className="rounded-full" disabled={pending} onClick={() => run("active")}>
            Approve
          </Button>
        ) : null}
        <Button
          size="sm"
          variant="outline"
          className="rounded-full"
          disabled={pending}
          onClick={() => run("rejected")}
        >
          Reject
        </Button>
        {status !== "suspended" ? (
          <Button
            size="sm"
            variant="ghost"
            className="rounded-full"
            disabled={pending}
            onClick={() => run("suspended")}
          >
            Suspend
          </Button>
        ) : null}
      </div>
    </div>
  );
}

export function CredentialReviewButton({
  credentialId,
  status,
}: {
  credentialId: string;
  status: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();

  return (
    <div className="flex gap-2">
      {status !== "approved" ? (
        <Button
          size="sm"
          variant="outline"
          className="rounded-full"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const result = await reviewCredentialAction({
                credentialId,
                status: "approved",
              });
              if (result.error) toast.error(result.error);
              else router.refresh();
            })
          }
        >
          Approve doc
        </Button>
      ) : null}
      {status !== "rejected" ? (
        <Button
          size="sm"
          variant="ghost"
          className="rounded-full"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const result = await reviewCredentialAction({
                credentialId,
                status: "rejected",
                reviewNote: "Please re-upload a clearer scan.",
              });
              if (result.error) toast.error(result.error);
              else router.refresh();
            })
          }
        >
          Reject doc
        </Button>
      ) : null}
    </div>
  );
}

export function credentialLabel(type: string) {
  return CREDENTIAL_LABELS[type as keyof typeof CREDENTIAL_LABELS] ?? type;
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
          router.refresh();
        })
      }
    />
  );
}
