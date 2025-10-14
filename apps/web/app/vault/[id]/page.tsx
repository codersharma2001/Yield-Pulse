import { notFound } from "next/navigation";

import type { VaultDetailResponse } from "@yield-dashboard/sdk";

import { VaultCharts } from "@/components/vaults/vault-charts";
import { VaultActionPanel } from "@/components/vaults/action-panel";
import { Card, CardContent } from "@/components/ui/card";
import type { NetworkEnvironment } from "@/store/network-env";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001";

async function fetchVaultDetail(id: string, env: NetworkEnvironment): Promise<VaultDetailResponse | null> {
  const response = await fetch(`${API_BASE_URL}/api/v1/vaults/${encodeURIComponent(id)}?env=${env}`, {
    next: { revalidate: 20 }
  });
  if (!response.ok) {
    return null;
  }
  return response.json();
}

interface VaultPageProps {
  params: { id: string };
  searchParams: { env?: string };
}

export default async function VaultPage({ params, searchParams }: VaultPageProps) {
  const id = decodeURIComponent(params.id);
  const env = (searchParams?.env === "mainnet" ? "mainnet" : "testnet") as NetworkEnvironment;
  const detail = await fetchVaultDetail(id, env);

  if (!detail) {
    notFound();
  }

  const { vault, snapshots } = detail;

  return (
    <section className="space-y-8">
      <div className="rounded-3xl border border-border bg-white/90 p-8 dark:bg-slate-950/70">
        <p className="text-sm uppercase tracking-wide text-slate-950/60">Vault</p>
        <div className="mt-2 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-semibold">{vault.name}</h1>
            <p className="text-sm text-slate-950/60 dark:text-slate-200/70">
              {vault.protocolId.toUpperCase()} • Chain ID {vault.chainId} • Asset {vault.asset} • Env {env}
            </p>
          </div>
          <div className="grid gap-1 text-right text-sm text-slate-950/60 dark:text-slate-200/70">
            <span className="text-xs uppercase tracking-wider">APY (7d)</span>
            <span className="text-2xl font-semibold text-accent">{(vault.apy.d7 * 100).toFixed(2)}%</span>
          </div>
        </div>
        <dl className="mt-6 grid gap-4 text-sm md:grid-cols-4">
          <div>
            <dt className="text-slate-950/60 dark:text-slate-200/60">TVL (USD)</dt>
            <dd className="text-base font-semibold text-foreground">${vault.tvlUsd.toLocaleString()}</dd>
          </div>
          <div>
            <dt className="text-slate-950/60 dark:text-slate-200/60">Capacity</dt>
            <dd className="text-base font-semibold text-foreground">
              {Math.round(vault.utilization * 100)}% / ${vault.capUsd.toLocaleString()}
            </dd>
          </div>
          <div>
            <dt className="text-slate-950/60 dark:text-slate-200/60">Risk band</dt>
            <dd className="capitalize text-base font-semibold text-foreground">{vault.risk}</dd>
          </div>
          <div>
            <dt className="text-slate-950/60 dark:text-slate-200/60">Last updated</dt>
            <dd className="text-base font-semibold text-foreground">
              {new Date(vault.lastUpdated).toLocaleString()}
            </dd>
          </div>
        </dl>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="bg-white/90 dark:bg-slate-950/70">
          <CardContent className="p-6">
            <VaultCharts snapshots={snapshots} />
          </CardContent>
        </Card>
        <VaultActionPanel vaultId={vault.id} chainId={vault.chainId} env={env} />
      </div>
    </section>
  );
}
