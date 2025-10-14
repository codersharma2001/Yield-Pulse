export interface VaultMetadata {
  id: string;
  chainId: number;
  asset: string;
  protocolId: string;
  name: string;
  symbol: string;
  vaultAddress: `0x${string}`;
  assetAddress: `0x${string}`;
}

export interface VaultMetrics {
  apy: {
    d7: number;
    d30: number;
  };
  tvlUsd: number;
  capUsd: number;
  utilization: number;
  risk: "low" | "medium" | "high";
  lastUpdated: string;
}

export interface VaultSnapshotPoint {
  t: number;
  v: number;
}

export interface VaultSnapshots {
  apy: VaultSnapshotPoint[];
  tvl: VaultSnapshotPoint[];
}

export interface VaultListItem extends VaultMetadata, VaultMetrics {}

export interface VaultDetailResponse {
  vault: VaultListItem;
  snapshots: VaultSnapshots;
}

export interface VaultListResponse {
  vaults: VaultListItem[];
  asOf: number;
}

export interface UserPosition {
  vaultId: string;
  shares: number;
  assets: number;
  entryValueUsd: number;
  currentValueUsd: number;
  pnlUsd: number;
}

export interface UserPositionsResponse {
  address: `0x${string}`;
  positions: UserPosition[];
  asOf: number;
}

export interface SimulationRequest {
  vaultId: string;
  action: "deposit" | "withdraw";
  chainId: number;
  from: `0x${string}`;
  amount: string;
  slippageBps?: number;
}

export interface SimulationResult {
  success: boolean;
  gasEstimate: string;
  reason?: string;
  balanceChanges?: Array<{ asset: string; delta: string }>;
}

export const createVaultId = (chainId: number, address: string) => `${chainId}:${address.toLowerCase()}`;

export const VERSION = "0.1.0";
