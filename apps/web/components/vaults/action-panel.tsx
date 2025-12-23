"use client";

import { useState } from "react";
import { useAccount, useNetwork } from "wagmi";
import { useMutation } from "@tanstack/react-query";

import type { SimulationRequest, SimulationResult } from "@yield-dashboard/sdk";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";
import type { NetworkEnvironment } from "@/store/network-env";
import { TransactionConfirmationModal } from "./transaction-confirmation-modal";
import { useVaultDeposit, useVaultWithdraw } from "@/lib/hooks/use-vault-transaction";
import type { Address } from "viem";

interface VaultActionPanelProps {
  vaultId: string;
  chainId: number;
  env: NetworkEnvironment;
  asset: string;
  symbol: string;
  vaultAddress: Address;
  assetAddress: Address;
  vaultName: string;
}

export function VaultActionPanel({ vaultId, chainId, env, asset, symbol, vaultAddress, assetAddress, vaultName }: VaultActionPanelProps) {
  const { address } = useAccount();
  const { chain } = useNetwork();
  const [amount, setAmount] = useState("1000");
  const [action, setAction] = useState<SimulationRequest["action"]>("deposit");
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Transaction hooks
  const depositHook = useVaultDeposit(vaultAddress, assetAddress);
  const withdrawHook = useVaultWithdraw(vaultAddress);
  const currentHook = action === "deposit" ? depositHook : withdrawHook;

  const mutation = useMutation({
    mutationFn: (body: SimulationRequest) => api.simulate(body, env),
    onSuccess(data) {
      setResult(data);
      setErrorMessage(null);
    },
    onError(error) {
      setResult(null);
      setErrorMessage(error instanceof Error ? error.message : "Simulation failed");
    }
  });

  const canSimulate = Boolean(address) && Number(amount) > 0;
  const canExecute = Boolean(result?.success && address);
  const isWrongChain = chain?.id !== chainId;
  const assetLabel = symbol || asset;

  const handleConfirmTransaction = () => {
    if (action === "deposit") {
      depositHook.deposit(amount);
    } else {
      withdrawHook.withdraw(amount);
    }
  };

  const handleCancelTransaction = () => {
    setIsModalOpen(false);
    currentHook.reset();
  };

  const handleProceedToRealTrade = () => {
    setIsModalOpen(true);
  };

  return (
    <Card className="bg-white/90 dark:bg-slate-950/70">
      <CardHeader>
        <CardTitle className="text-lg">Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm text-slate-950/70 dark:text-slate-200/70">
        <div className="rounded-lg border border-border/70 bg-white/60 p-3 text-xs text-foreground dark:border-white/10 dark:bg-white/5 dark:text-slate-100">
          <p className="font-semibold uppercase tracking-wide text-slate-950/70 dark:text-slate-300/80">Simulation context</p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <div>
              <p className="text-[11px] uppercase text-slate-500 dark:text-slate-400">Action</p>
              <p className="font-semibold capitalize text-foreground dark:text-white">{action}</p>
            </div>
            <div>
              <p className="text-[11px] uppercase text-slate-500 dark:text-slate-400">Chain</p>
              <p className="font-semibold text-foreground dark:text-white">{chainId}</p>
            </div>
            <div>
              <p className="text-[11px] uppercase text-slate-500 dark:text-slate-400">Vault</p>
              <p className="truncate font-semibold text-foreground dark:text-white">{vaultId}</p>
            </div>
            <div>
              <p className="text-[11px] uppercase text-slate-500 dark:text-slate-400">Asset</p>
              <p className="font-semibold text-foreground dark:text-white">{assetLabel}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {(["deposit", "withdraw"] as const).map((value) => (
            <Button
              key={value}
              type="button"
              size="sm"
              variant={action === value ? "default" : "outline"}
              className="w-full"
              onClick={() => setAction(value)}
            >
              {value === "deposit" ? "Deposit" : "Withdraw"}
            </Button>
          ))}
        </div>

        <div className="grid gap-2">
          <label htmlFor="amount" className="text-xs uppercase tracking-wider">
            Amount ({assetLabel})
          </label>
          <input
            id="amount"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            className="rounded-lg border border-border bg-white px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-accent dark:border-white/20 dark:bg-slate-950"
            placeholder="1000"
          />
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            This is the {assetLabel} amount that will be simulated on-chain.
          </p>
        </div>
        <Button
          size="md"
          onClick={() =>
            mutation.mutate({
              vaultId,
              action,
              chainId,
              from: (address ?? "0x0000000000000000000000000000000000000000") as `0x${string}`,
              amount
            })
          }
          disabled={!canSimulate || mutation.isPending}
        >
          {mutation.isPending ? "Simulating…" : `Simulate ${action} ${amount} ${assetLabel}`}
        </Button>
        {!address ? <p className="text-xs">Connect a wallet to run simulations.</p> : null}
        {isWrongChain ? (
          <p className="text-xs text-amber-600 dark:text-amber-400">
            Please switch to the correct network (Chain ID: {chainId}) to execute transactions.
          </p>
        ) : null}
        {errorMessage ? <p className="text-xs text-red-500 dark:text-red-300">{errorMessage}</p> : null}

        {/* Proceed with Real Trade Button */}
        {result?.success && canExecute && !isWrongChain && (
          <Button
            size="md"
            variant="primary"
            onClick={handleProceedToRealTrade}
            className="w-full bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600"
          >
            Proceed with Real Trade →
          </Button>
        )}

        <div className="rounded-lg border border-border/70 bg-white/60 p-3 text-xs dark:border-white/10 dark:bg-white/5">
          <p className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">Latest simulation</p>
          {result ? (
            <div className="mt-2 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-foreground dark:text-white">
                  {result.success ? "Passed" : "Failed"}
                </span>
                <span className={result.success ? "text-green-600 dark:text-emerald-300" : "text-red-500 dark:text-red-300"}>
                  Gas {result.gasEstimate}
                </span>
              </div>
              {result.reason ? (
                <p className="text-slate-600 dark:text-slate-300">
                  Reason: <span className="font-medium text-foreground dark:text-white">{result.reason}</span>
                </p>
              ) : null}
              {result.balanceChanges?.length ? (
                <div className="space-y-1">
                  <p className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">Balance changes</p>
                  <ul className="space-y-1 text-foreground dark:text-white">
                    {result.balanceChanges.map((change, index) => (
                      <li
                        key={`${change.asset}-${index}`}
                        className="flex items-center justify-between rounded-md bg-slate-100 px-2 py-1 text-xs dark:bg-slate-900/80"
                      >
                        <span className="font-medium">{change.asset}</span>
                        <span className="font-mono">{change.delta}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="text-slate-600 dark:text-slate-300">No balance deltas returned.</p>
              )}
            </div>
          ) : (
            <p className="mt-2 text-slate-600 dark:text-slate-300">Run a simulation to see results here.</p>
          )}
        </div>
      </CardContent>

      {/* Transaction Confirmation Modal */}
      <TransactionConfirmationModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          currentHook.reset();
        }}
        simulation={result}
        vaultDetails={{
          name: vaultName,
          asset,
          action,
          amount,
          chainId,
        }}
        transactionState={currentHook.state}
        onConfirm={handleConfirmTransaction}
        onCancel={handleCancelTransaction}
      />
    </Card>
  );
}
