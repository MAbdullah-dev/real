"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const revenue = [
  { m: "Jan", total: 420 },
  { m: "Feb", total: 510 },
  { m: "Mar", total: 580 },
  { m: "Apr", total: 640 },
  { m: "May", total: 710 },
];

export default function AdminOverviewPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Command center</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Stripe/Linear-inspired admin shell with analytics, approvals, and governance.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: "MAU", value: "48.2k" },
          { label: "Agents", value: "1,204" },
          { label: "GMV", value: "$182M" },
          { label: "SLA", value: "99.2%" },
        ].map((k) => (
          <Card key={k.label} className="rounded-3xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{k.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold tabular-nums">{k.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card className="rounded-3xl">
        <CardHeader>
          <CardTitle>Subscription revenue</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={revenue}>
              <XAxis dataKey="m" stroke="var(--color-muted-foreground)" fontSize={12} />
              <YAxis stroke="var(--color-muted-foreground)" fontSize={12} />
              <Tooltip
                contentStyle={{
                  borderRadius: 16,
                  borderColor: "var(--color-border)",
                  background: "var(--color-popover)",
                }}
              />
              <Bar dataKey="total" fill="var(--color-primary)" radius={[12, 12, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
