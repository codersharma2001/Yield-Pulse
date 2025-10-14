"use client";

import { useMemo } from "react";

import { Button } from "@/components/ui/button";
import { useNetworkEnv } from "@/store/network-env";

const OPTIONS = [
  { value: "testnet" as const, label: "Testnets" },
  { value: "mainnet" as const, label: "Mainnets" }
];

export function NetworkToggle() {
  const env = useNetworkEnv((state) => state.env);
  const setEnv = useNetworkEnv((state) => state.setEnv);

  const active = useMemo(() => OPTIONS.find((opt) => opt.value === env) ?? OPTIONS[0], [env]);

  return (
    <div className="flex gap-2 rounded-lg border border-border bg-white/70 p-1 dark:border-white/15 dark:bg-slate-950/70">
      {OPTIONS.map((option) => (
        <Button
          key={option.value}
          variant={option.value === active.value ? "primary" : "ghost"}
          size="sm"
          onClick={() => setEnv(option.value)}
        >
          {option.label}
        </Button>
      ))}
    </div>
  );
}
