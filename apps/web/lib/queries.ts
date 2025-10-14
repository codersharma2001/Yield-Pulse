"use client";

import { useQuery } from "@tanstack/react-query";

import { api } from "./api";
import type { NetworkEnvironment } from "@/store/network-env";

export const VAULTS_QUERY_KEY = ["vaults"] as const;

export function useVaultsQuery(env: NetworkEnvironment) {
  return useQuery({
    queryKey: [...VAULTS_QUERY_KEY, env],
    queryFn: () => api.getVaults(env),
    staleTime: 30_000
  });
}
