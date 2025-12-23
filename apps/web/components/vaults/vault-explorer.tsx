"use client";

import Link from "next/link";
import { useMemo, type ComponentProps } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatNumber, formatPercent } from "@/lib/utils";
import { useVaultsQuery } from "@/lib/queries";
import { getSupportedChains } from "@/lib/wagmi";
import { useNetworkEnv } from "@/store/network-env";
import { ProtocolBadge } from "./protocol-badge";

const RISK_TONE: Record<string, { label: string; variant: ComponentProps<typeof Badge>["variant"] }> = {
  low: { label: "Low", variant: "success" },
  medium: { label: "Medium", variant: "warning" },
  high: { label: "High", variant: "danger" }
};

export function VaultExplorer() {
  const env = useNetworkEnv((state) => state.env);
  const { data, isLoading, isError, refetch, isFetching } = useVaultsQuery(env);

  const rows = useMemo(() => data?.vaults ?? [], [data]);
  const chainNameMap = useMemo(
    () => new Map(getSupportedChains(env).map((chain) => [chain.id, chain.name])),
    [env]
  );

  if (isError) {
    return (
      <Card className="bg-white/90 dark:bg-slate-950/70">
        <CardHeader>
          <CardTitle className="text-lg">Unable to load vaults</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-slate-950/70 dark:text-slate-200/70">
          <p>The aggregator API is unreachable right now. Retry in a moment or verify the backend is running.</p>
          <Button variant="primary" size="sm" onClick={() => refetch()}>
            Try again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Explore yields</h2>
          <p className="text-sm text-slate-950/60 dark:text-slate-200/70">
            Aggregated APYs from Aave, Curve, and Pendle across supported {env === "mainnet" ? "mainnets" : "testnets"}.
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={() => refetch()} disabled={isFetching}>
          {isFetching ? "Refreshing…" : "Refresh"}
        </Button>
      </div>

      <Card className="overflow-hidden bg-white/90 dark:bg-slate-950/70">
        <CardContent className="p-0">
          <div className="relative overflow-x-auto">
            <table className="min-w-full divide-y divide-border/70 text-left text-sm">
              <thead className="bg-slate-950/5 text-xs uppercase tracking-wide text-slate-950/60 dark:bg-white/5 dark:text-slate-200/60">
                <tr>
                  <th className="px-6 py-4 font-semibold">Vault</th>
                  <th className="px-6 py-4 font-semibold">Chain</th>
                  <th className="px-6 py-4 font-semibold">Protocol</th>
                  <th className="px-6 py-4 font-semibold">APY (7d)</th>
                  <th className="px-6 py-4 font-semibold">TVL</th>
                  <th className="px-6 py-4 font-semibold">Capacity</th>
                  <th className="px-6 py-4 font-semibold">Risk</th>
                  <th className="px-6 py-4" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {isLoading
                  ? Array.from({ length: 4 }).map((_, idx) => (
                      <tr key={idx} className="animate-pulse">
                        <td className="px-6 py-4" colSpan={8}>
                          <div className="h-4 rounded bg-slate-950/10 dark:bg-white/10" />
                        </td>
                      </tr>
                    ))
                  : rows.map((vault) => {
                      const risk = RISK_TONE[vault.risk] ?? RISK_TONE.medium;
                      const capacityUsed = vault.capUsd > 0 ? vault.tvlUsd / vault.capUsd : 0;
                      return (
                        <tr key={vault.id} className="hover:bg-slate-950/5 dark:hover:bg-white/5">
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className="font-semibold text-foreground dark:text-white">{vault.name}</span>
                              <span className="text-xs text-slate-950/60 dark:text-slate-200/70">{vault.symbol}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">{chainNameMap.get(vault.chainId) ?? vault.chainId}</td>
                          <td className="px-6 py-4">
                            <ProtocolBadge protocol={vault.protocolMetadata} />
                          </td>
                          <td className="px-6 py-4 font-semibold text-accent">{formatPercent(vault.apy.d7)}</td>
                          <td className="px-6 py-4">${formatNumber(vault.tvlUsd)}</td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col gap-1">
                              <div className="h-1.5 rounded-full bg-slate-950/10 dark:bg-white/10">
                                <div
                                  className="h-full rounded-full bg-accent"
                                  style={{ width: `${Math.min(capacityUsed * 100, 100)}%` }}
                                />
                              </div>
                              <span className="text-xs text-slate-950/60 dark:text-slate-200/70">
                                {formatNumber(vault.utilization * 100)}% used
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <Badge variant={risk.variant}>{risk.label}</Badge>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <Button asChild size="sm" variant="primary">
                              <Link href={`/vault/${encodeURIComponent(vault.id)}?env=${env}`}>Open</Link>
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
