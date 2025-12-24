/**
 * Data service for Next.js API routes
 * Imports logic from the API package and re-exports for use in API routes
 */

import type { SimulationRequest } from "@yield-dashboard/sdk";

// Import the sample data functions from the SDK sample-data module
import {
  SAMPLE_VAULTS_MAP,
  SAMPLE_VAULT_DETAIL,
  SAMPLE_POSITIONS,
  type NetworkEnvironment
} from "@yield-dashboard/sdk/sample-data";

// Import real Tenderly simulation
import { simulateTenderly } from "@/lib/tenderly/simulate";

export async function getVaults(env?: "mainnet" | "testnet") {
  const environment = (env || "testnet") as NetworkEnvironment;
  return SAMPLE_VAULTS_MAP[environment];
}

export async function getVaultDetail(id: string, env?: "mainnet" | "testnet") {
  const detail = SAMPLE_VAULT_DETAIL[id];
  return detail || null;
}

export async function getUserPositions(address: string, env?: "mainnet" | "testnet") {
  // Return sample positions for now
  // In production, this would fetch real positions from the blockchain
  return {
    ...SAMPLE_POSITIONS,
    address
  };
}

export async function simulateAction(request: SimulationRequest) {
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
}
