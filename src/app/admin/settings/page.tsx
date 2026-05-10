import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export default function AdminSettingsPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
      <Card className="rounded-3xl">
        <CardHeader>
          <CardTitle>Role permissions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          {[
            { id: "approve", label: "Approve listings", on: true },
            { id: "refunds", label: "Issue refunds", on: true },
            { id: "pii", label: "Export PII", on: false },
          ].map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-4 rounded-2xl border border-border p-4">
              <Label htmlFor={item.id}>{item.label}</Label>
              <Switch id={item.id} defaultChecked={item.on} />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
