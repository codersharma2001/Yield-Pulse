"use client";

import { Badge } from "@/components/ui/badge";
import { useNetworkEnv } from "@/store/network-env";

export function NetworkStatusBadge() {
  const env = useNetworkEnv((state) => state.env);
  return (
    <Badge variant={env === "mainnet" ? "accent" : "warning"} className="w-fit">
      {env === "mainnet" ? "Mainnet mode" : "Testnet mode"}
    </Badge>
  );
}
