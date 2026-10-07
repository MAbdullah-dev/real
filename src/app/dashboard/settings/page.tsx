import { Suspense } from "react";

import { PasswordForm } from "@/components/dashboard/password-form";
import { ProfileForm } from "@/components/dashboard/profile-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/server/auth";
import { getActiveSubscription } from "@/server/subscriptions";

async function SettingsContent() {
  const session = await requireAuth();
  const [user, subscription] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true, email: true, image: true, passwordHash: true },
    }),
    getActiveSubscription(session.user.id),
  ]);

  return (
    <>
      <Card className="rounded-3xl">
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <ProfileForm
            defaultValues={{ name: user?.name ?? "", image: user?.image ?? "" }}
            email={user?.email ?? ""}
          />
        </CardContent>
      </Card>

      <Card className="rounded-3xl">
        <CardHeader>
          <CardTitle>Password</CardTitle>
        </CardHeader>
        <CardContent>
          {user?.passwordHash ? (
            <PasswordForm />
          ) : (
            <p className="text-sm text-muted-foreground">
              You sign in with a social provider, so there is no password to change.
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-3xl">
        <CardHeader>
          <CardTitle>Billing</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          {subscription
            ? `${subscription.plan.name} · ${subscription.status}${
                subscription.currentPeriodEnd
                  ? ` · renews ${subscription.currentPeriodEnd.toLocaleDateString("en-US")}`
                  : ""
              }`
            : "No active subscription. Agent plans are managed from the agent console."}
        </CardContent>
      </Card>
    </>
  );
}

export default function UserSettingsPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Profile, password, and billing preferences.
        </p>
      </div>
      <Suspense fallback={<Skeleton className="h-96 w-full rounded-3xl" />}>
        <SettingsContent />
      </Suspense>
    </div>
  );
}
