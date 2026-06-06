"use client";

import * as React from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { formatCurrency } from "@/lib/currency";

export interface RevenuePoint {
  date: string;
  amount: number;
}

interface RevenueChartProps {
  data: readonly RevenuePoint[];
  currency: "EUR" | "AED" | "USD" | "LBP";
}

export function RevenueChart({ data, currency }: RevenueChartProps): JSX.Element {
  return (
    <div className="h-64 w-full motion-reduce:animate-none">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data as RevenuePoint[]}
          margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
        >
          <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
            tickFormatter={(value: string) => value.slice(5)}
            interval="preserveStartEnd"
            minTickGap={24}
          />
          <YAxis
            width={56}
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
            tickFormatter={(value: number) =>
              new Intl.NumberFormat(undefined, {
                notation: "compact",
                maximumFractionDigits: 1,
              }).format(value)
            }
          />
          <Tooltip
            cursor={{ stroke: "hsl(var(--primary))", strokeWidth: 1 }}
            contentStyle={{
              background: "hsl(var(--popover))",
              borderRadius: 8,
              border: "1px solid hsl(var(--border))",
              fontSize: 12,
            }}
            formatter={(value: number) => [
              formatCurrency(value, currency),
              "Revenue",
            ]}
          />
          <Line
            type="monotone"
            dataKey="amount"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
