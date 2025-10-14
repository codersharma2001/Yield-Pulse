"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { useMutation } from "@tanstack/react-query";

import type { SimulationRequest } from "@yield-dashboard/sdk";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";
import type { NetworkEnvironment } from "@/store/network-env";

interface VaultActionPanelProps {
  vaultId: string;
  chainId: number;
  env: NetworkEnvironment;
}

export function VaultActionPanel({ vaultId, chainId, env }: VaultActionPanelProps) {
  const { address } = useAccount();
  const [amount, setAmount] = useState("1000");
  const [resultMessage, setResultMessage] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: (body: SimulationRequest) => api.simulate(body, env),
    onSuccess(data) {
      setResultMessage(data.success ? `Simulation passed. Est. gas ${data.gasEstimate}` : data.reason ?? "Failed");
    },
    onError(error) {
      setResultMessage(error instanceof Error ? error.message : "Simulation failed");
    }
  });

  const canSimulate = Boolean(address) && Number(amount) > 0;

  return (
    <Card className="bg-white/90 dark:bg-slate-950/70">
      <CardHeader>
        <CardTitle className="text-lg">Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm text-slate-950/70 dark:text-slate-200/70">
        <div className="grid gap-2">
          <label htmlFor="amount" className="text-xs uppercase tracking-wider">
            Amount
          </label>
          <input
            id="amount"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            className="rounded-lg border border-border bg-white px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-accent dark:border-white/20 dark:bg-slate-950"
            placeholder="1000"
          />
        </div>
        <Button
          size="md"
          onClick={() =>
            mutation.mutate({
              vaultId,
              action: "deposit",
              chainId,
              from: (address ?? "0x0000000000000000000000000000000000000000") as `0x${string}`,
              amount
            })
          }
          disabled={!canSimulate || mutation.isPending}
        >
          {mutation.isPending ? "Simulating…" : "Simulate with Tenderly"}
        </Button>
        {!address ? <p className="text-xs">Connect a wallet to run simulations.</p> : null}
        {resultMessage ? <p className="text-xs text-accent">{resultMessage}</p> : null}
      </CardContent>
    </Card>
  );
}
