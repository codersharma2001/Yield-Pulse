"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useAccount } from "wagmi";
import { useQuery } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";
import { formatNumber } from "@/lib/utils";
import { useNetworkEnv } from "@/store/network-env";

export function PortfolioTable() {
  const { address, isConnecting } = useAccount();
  const env = useNetworkEnv((state) => state.env);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["positions", address, env],
    queryFn: () => {
      if (!address) throw new Error("wallet not connected");
      return api.getPositions(address, env);
    },
    enabled: Boolean(address)
  });

  const rows = useMemo(() => data?.positions ?? [], [data]);

  if (!address) {
    return (
      <Card className="bg-white/90 dark:bg-slate-950/70">
        <CardHeader>
          <CardTitle className="text-lg">Connect your wallet</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-slate-950/60 dark:text-slate-200/70">
          {isConnecting ? "Checking wallet status…" : "Connect a wallet to see cross-chain vault positions."}
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card className="bg-white/90 dark:bg-slate-950/70">
        <CardHeader>
          <CardTitle className="text-lg">Unable to load positions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-slate-950/60 dark:text-slate-200/70">
          <p>The indexer is offline or unreachable. Retry in a moment.</p>
          <Button size="sm" onClick={() => refetch()}>
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="bg-white/90 dark:bg-slate-950/70">
        <CardHeader>
          <CardTitle className="text-lg">Loading positions…</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx} className="h-4 w-full animate-pulse rounded bg-slate-950/10 dark:bg-white/10" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!rows.length) {
    return (
      <Card className="bg-white/90 dark:bg-slate-950/70">
        <CardHeader>
          <CardTitle className="text-lg">No positions yet</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-slate-950/60 dark:text-slate-200/70">
          Deposit into a vault to see your holdings here.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/90 dark:bg-slate-950/70">
      <CardHeader>
        <CardTitle className="text-lg">Your positions ({env === "mainnet" ? "Mainnet" : "Testnet"})</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <table className="min-w-full divide-y divide-border/70 text-sm">
          <thead className="bg-slate-950/5 text-xs uppercase tracking-wide text-slate-950/60 dark:bg-white/5 dark:text-slate-200/60">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">Vault</th>
              <th className="px-4 py-3 text-left font-semibold">Shares</th>
              <th className="px-4 py-3 text-left font-semibold">Assets</th>
              <th className="px-4 py-3 text-left font-semibold">Entry</th>
              <th className="px-4 py-3 text-left font-semibold">Current</th>
              <th className="px-4 py-3 text-left font-semibold">PnL</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {rows.map((position) => (
              <tr key={position.vaultId} className="hover:bg-slate-950/5 dark:hover:bg-white/5">
                <td className="px-4 py-3 font-medium text-foreground">{position.vaultId}</td>
                <td className="px-4 py-3">{position.shares.toFixed(4)}</td>
                <td className="px-4 py-3">{position.assets.toFixed(4)}</td>
                <td className="px-4 py-3">${formatNumber(position.entryValueUsd)}</td>
                <td className="px-4 py-3">${formatNumber(position.currentValueUsd)}</td>
                <td className="px-4 py-3 text-success">${formatNumber(position.pnlUsd)}</td>
                <td className="px-4 py-3 text-right">
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/vault/${encodeURIComponent(position.vaultId)}?env=${env}`}>Manage</Link>
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
