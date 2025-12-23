import {
  SAMPLE_POSITIONS,
  SAMPLE_VAULTS_MAP,
  SAMPLE_VAULT_DETAIL
} from "@yield-dashboard/sdk/sample-data";
import type {
  SimulationRequest,
  SimulationResult,
  UserPositionsResponse,
  VaultDetailResponse,
  VaultListResponse
} from "@yield-dashboard/sdk";
import type { NetworkEnvironment } from "@yield-dashboard/sdk/sample-data";

import { env } from "../env";

const now = () => Math.floor(Date.now() / 1000);

const pickDataset = (override?: NetworkEnvironment) => SAMPLE_VAULTS_MAP[override ?? env.NETWORK_ENV];

export const getVaults = async (overrideEnv?: NetworkEnvironment): Promise<VaultListResponse> => {
  const dataset = pickDataset(overrideEnv);
  return {
    ...dataset,
    asOf: now()
  };
};

export const getVaultDetail = async (
  id: string,
  overrideEnv?: NetworkEnvironment
): Promise<VaultDetailResponse | null> => {
  const dataset = pickDataset(overrideEnv);
  if (!dataset.vaults.some((vault) => vault.id === id)) {
    return null;
  }
  const detail = SAMPLE_VAULT_DETAIL[id];
  if (!detail) {
    return null;
  }
  return detail;
};

export const getUserPositions = async (
  address: string,
  overrideEnv?: NetworkEnvironment
): Promise<UserPositionsResponse> => {
  const dataset = pickDataset(overrideEnv);
  const fallbackVault = dataset.vaults[0];
  const base = SAMPLE_POSITIONS.positions[0];
  const position = fallbackVault
    ? { ...base, vaultId: fallbackVault.id }
    : base;

  return {
    address: address as `0x${string}`,
    asOf: now(),
    positions: fallbackVault ? [position] : []
  };
};

import { simulateTenderly } from "../tenderly/simulate";

export const simulateAction = async (request: SimulationRequest): Promise<SimulationResult> => {
  // Validate amount
  if (request.amount === "0" || isNaN(Number(request.amount))) {
    return {
      success: false,
      gasEstimate: "0",
      reason: "Invalid amount"
    };
  }

  // Call real Tenderly simulation
  return simulateTenderly(request);
};
