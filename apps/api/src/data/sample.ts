import {
  SAMPLE_POSITIONS,
  SAMPLE_SIMULATION_FAIL,
  SAMPLE_SIMULATION_OK,
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

export const simulateAction = async (request: SimulationRequest): Promise<SimulationResult> => {
  if (request.amount === "0") {
    return SAMPLE_SIMULATION_FAIL;
  }
  return SAMPLE_SIMULATION_OK;
};
