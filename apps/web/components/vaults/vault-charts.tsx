"use client";

import { useMemo, useState } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import type { VaultSnapshots } from "@yield-dashboard/sdk";

import { Button } from "@/components/ui/button";

function formatTimestamp(ts: number) {
  return new Date(ts * 1000).toLocaleDateString();
}

function formatApy(value: number) {
  return `${(value * 100).toFixed(2)}%`;
}

function formatUsd(value: number) {
  return `$${Intl.NumberFormat(undefined, { notation: "compact", maximumFractionDigits: 2 }).format(value)}`;
}

interface VaultChartsProps {
  snapshots: VaultSnapshots;
}

export function VaultCharts({ snapshots }: VaultChartsProps) {
  const [view, setView] = useState<"apy" | "tvl">("apy");

  const chartData = useMemo(() => {
    const source = view === "apy" ? snapshots.apy : snapshots.tvl;
    return [...source].reverse().map((point) => ({
      timestamp: point.t,
      value: point.v
    }));
  }, [snapshots, view]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Performance</h2>
        <div className="flex gap-2">
          <Button variant={view === "apy" ? "primary" : "secondary"} size="sm" onClick={() => setView("apy")}>
            APY
          </Button>
          <Button variant={view === "tvl" ? "primary" : "secondary"} size="sm" onClick={() => setView("tvl")}>
            TVL
          </Button>
        </div>
      </div>
      <div className="h-72 w-full">
        <ResponsiveContainer>
          <AreaChart data={chartData} margin={{ top: 10, left: 0, right: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorAccent" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="timestamp"
              tickFormatter={formatTimestamp}
              stroke="rgba(15,23,42,0.35)"
              tickLine={false}
            />
            <YAxis
              domain={view === "apy" ? ["auto", "auto"] : [0, "auto"]}
              tickFormatter={view === "apy" ? formatApy : formatUsd}
              stroke="rgba(15,23,42,0.35)"
              tickLine={false}
              width={80}
            />
            <Tooltip
              contentStyle={{ backgroundColor: "#0f172a", color: "white", borderRadius: 12, border: "none" }}
              formatter={(value: number) => (view === "apy" ? formatApy(value) : formatUsd(value))}
              labelFormatter={(value) => formatTimestamp(Number(value))}
            />
            <Area type="monotone" dataKey="value" stroke="#0ea5e9" fill="url(#colorAccent)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
