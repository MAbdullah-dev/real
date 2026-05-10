"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const data = [
  { label: "Mon", views: 420, leads: 18 },
  { label: "Tue", views: 510, leads: 22 },
  { label: "Wed", views: 480, leads: 20 },
  { label: "Thu", views: 620, leads: 27 },
  { label: "Fri", views: 690, leads: 31 },
  { label: "Sat", views: 740, leads: 34 },
  { label: "Sun", views: 700, leads: 30 },
];

export default function AgentAnalyticsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
        <p className="mt-2 text-sm text-muted-foreground">Funnel metrics with exportable cohorts.</p>
      </div>
      <Card className="rounded-3xl">
        <CardHeader>
          <CardTitle>Views vs qualified leads</CardTitle>
        </CardHeader>
        <CardContent className="h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="label" stroke="var(--color-muted-foreground)" fontSize={12} />
              <YAxis stroke="var(--color-muted-foreground)" fontSize={12} />
              <Tooltip
                contentStyle={{
                  borderRadius: 16,
                  borderColor: "var(--color-border)",
                  background: "var(--color-popover)",
                }}
              />
              <Area type="monotone" dataKey="views" stroke="var(--color-primary)" fillOpacity={1} fill="url(#colorViews)" />
              <Area type="monotone" dataKey="leads" stroke="var(--color-accent)" fillOpacity={0} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
