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
  SAMPLE_SIMULATION_OK,
  SAMPLE_SIMULATION_FAIL,
  type NetworkEnvironment
} from "@yield-dashboard/sdk/sample-data";

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
  // Simulate transaction using Tenderly
  // For now, return success or fail based on simple validation

  try {
    const amount = parseFloat(request.amount);

    // Simple validation
    if (amount <= 0) {
      return {
        ...SAMPLE_SIMULATION_FAIL,
        reason: "Amount must be greater than 0"
      };
    }

    if (amount > 1000000) {
      return {
        ...SAMPLE_SIMULATION_FAIL,
        reason: "Amount exceeds maximum limit"
      };
    }

    // Return success simulation
    return {
      ...SAMPLE_SIMULATION_OK,
      balanceChanges: [
        {
          asset: request.action === "deposit" ? "Input Asset" : "Vault Shares",
          delta: `-${request.amount}`
        },
        {
          asset: request.action === "deposit" ? "Vault Shares" : "Output Asset",
          delta: `+${(amount * 0.995).toFixed(2)}` // Simulate 0.5% fee
        }
      ]
    };
  } catch (error) {
    return {
      ...SAMPLE_SIMULATION_FAIL,
      reason: error instanceof Error ? error.message : "Unknown error"
    };
  }
}
