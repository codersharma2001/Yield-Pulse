import { create } from "zustand";

export type NetworkEnvironment = "mainnet" | "testnet";

const DEFAULT_ENV = (process.env.NEXT_PUBLIC_NETWORK_ENV as NetworkEnvironment | undefined) ?? "testnet";

interface NetworkEnvState {
  env: NetworkEnvironment;
  setEnv: (env: NetworkEnvironment) => void;
}

export const useNetworkEnv = create<NetworkEnvState>((set) => ({
  env: DEFAULT_ENV,
  setEnv: (env) => set({ env })
}));
