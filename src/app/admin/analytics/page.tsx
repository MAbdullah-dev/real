"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const data = Array.from({ length: 12 }).map((_, i) => ({
  label: `W${i + 1}`,
  conv: 20 + i * 1.4,
}));

export default function AdminAnalyticsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
      <Card className="rounded-3xl">
        <CardHeader>
          <CardTitle>Visit → offer conversion</CardTitle>
        </CardHeader>
        <CardContent className="h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <XAxis dataKey="label" stroke="var(--color-muted-foreground)" fontSize={12} />
              <YAxis stroke="var(--color-muted-foreground)" fontSize={12} />
              <Tooltip
                contentStyle={{
                  borderRadius: 16,
                  borderColor: "var(--color-border)",
                  background: "var(--color-popover)",
                }}
              />
              <Line type="monotone" dataKey="conv" stroke="var(--color-primary)" strokeWidth={3} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
