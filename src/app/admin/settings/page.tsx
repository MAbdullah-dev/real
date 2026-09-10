import { Suspense } from "react";

import { AdminSettingSwitch } from "@/components/admin/moderation-controls";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getAdminSettings } from "@/server/admin";

async function SettingsList() {
  const settings = await getAdminSettings();

  return (
    <Card className="rounded-3xl">
      <CardHeader>
        <CardTitle>Marketplace controls</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        {settings.map((setting) => (
          <div
            key={setting.key}
            className="flex items-center justify-between gap-4 rounded-2xl border border-border p-4"
          >
            <div>
              <p className="font-medium">{setting.label}</p>
              <p className="text-muted-foreground">{setting.description}</p>
            </div>
            <AdminSettingSwitch settingKey={setting.key} value={setting.value} />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export default function AdminSettingsPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
      <Suspense fallback={<Skeleton className="h-64 w-full rounded-3xl" />}>
        <SettingsList />
      </Suspense>
    </div>
  );
}
