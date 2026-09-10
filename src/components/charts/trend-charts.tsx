"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const tooltipStyle = {
  borderRadius: 16,
  borderColor: "var(--color-border)",
  background: "var(--color-popover)",
} as const;

const axisProps = {
  stroke: "var(--color-muted-foreground)",
  fontSize: 12,
} as const;

export type TrendPoint = { label: string; views: number; leads: number };

export function ViewsLeadsChart({ data }: { data: TrendPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data}>
        <defs>
          <linearGradient id="viewsFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.35} />
            <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis dataKey="label" {...axisProps} />
        <YAxis allowDecimals={false} {...axisProps} />
        <Tooltip contentStyle={tooltipStyle} />
        <Area
          type="monotone"
          dataKey="views"
          name="Views"
          stroke="var(--color-primary)"
          fillOpacity={1}
          fill="url(#viewsFill)"
        />
        <Area
          type="monotone"
          dataKey="leads"
          name="Enquiries"
          stroke="var(--color-accent)"
          fillOpacity={0}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function RevenueChart({ data }: { data: { label: string; total: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data}>
        <XAxis dataKey="label" {...axisProps} />
        <YAxis allowDecimals={false} {...axisProps} />
        <Tooltip contentStyle={tooltipStyle} formatter={(value) => `$${value}`} />
        <Bar dataKey="total" name="MRR" fill="var(--color-primary)" radius={[12, 12, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function ConversionChart({ data }: { data: { label: string; conv: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <XAxis dataKey="label" {...axisProps} />
        <YAxis {...axisProps} />
        <Tooltip contentStyle={tooltipStyle} formatter={(value) => `${value}%`} />
        <Line
          type="monotone"
          dataKey="conv"
          name="Conversion"
          stroke="var(--color-primary)"
          strokeWidth={3}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
