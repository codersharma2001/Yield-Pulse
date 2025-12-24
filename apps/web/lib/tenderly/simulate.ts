import type { SimulationRequest, SimulationResult } from "@yield-dashboard/sdk";
import { SAMPLE_VAULT_DETAIL } from "@yield-dashboard/sdk/sample-data";
import { keccak256, parseUnits } from "viem";

import { getTenderlyClient, isTenderlyConfigured } from "./client";
import { encodeDepositCall, encodeWithdrawCall } from "./encoder";

type StateOverrides = Record<string, { balance?: string; storage?: Record<string, string>; code?: string }>;

const NATIVE_BALANCE = 10n ** 20n; // plenty of ETH for gas in simulation

const toBytes32 = (value: string | bigint) => {
  const hex = typeof value === "bigint" ? value.toString(16) : value.replace(/^0x/, "");
  return `0x${hex.padStart(64, "0")}` as `0x${string}`;
};

// Format a bigint as a properly padded 32-byte hex string for storage values
const toStorageValue = (value: bigint): string => {
  return `0x${value.toString(16).padStart(64, "0")}`;
};

const addressVariants = (addr: `0x${string}`) => {
  const lower = addr.toLowerCase() as `0x${string}`;
  return Array.from(new Set([addr, lower]));
};

// Computes storage slot for mapping(key => value) at given slot index
const mappingSlot = (key: `0x${string}`, slotIndex: number | bigint) => {
  const slotHex = typeof slotIndex === "bigint" ? slotIndex : BigInt(slotIndex);
  return keccak256((toBytes32(key) + toBytes32(slotHex).slice(2)) as `0x${string}`);
};

// Computes storage slot for mapping(key => mapping(key2 => value)) at given slot index
const doubleMappingSlot = (key1: `0x${string}`, key2: `0x${string}`, slotIndex: number | bigint) => {
  const first = mappingSlot(key1, slotIndex);
  return keccak256((toBytes32(key2) + first.slice(2)) as `0x${string}`);
};

const buildStateOverrides = (
  from: `0x${string}`,
  vaultAddress: `0x${string}`,
  assetAddress: `0x${string}`,
  amountWei: bigint,
  action: SimulationRequest["action"]
): StateOverrides => {
  const overrides: StateOverrides = {};
  const generousAmount = 10n ** 24n;
  const allowanceAmount = generousAmount;

  // Native balance for the caller (ETH for gas)
  overrides[from] = { balance: toStorageValue(NATIVE_BALANCE) };

  // ERC20 balances/allowances — cover common OZ/proxy/Maker slots
  const balanceSlots = [0, 1, 2, 3, 9];
  const allowanceSlots = [1, 2, 3, 10];

  const storage: Record<string, string> = {};
  for (const slot of balanceSlots) {
    const balanceSlot = mappingSlot(from, slot);
    storage[balanceSlot] = toStorageValue(generousAmount);
  }
  for (const slot of allowanceSlots) {
    const allowanceSlot = doubleMappingSlot(from, vaultAddress, slot);
    storage[allowanceSlot] = toStorageValue(allowanceAmount);
  }

  addressVariants(assetAddress).forEach((addr) => {
    overrides[addr] = { storage };
  });

  // ERC4626 share token balances (withdraw path)
  const vaultStorage: Record<string, string> = {};
  for (const slot of [0, 1, 2, 3, 9]) {
    const shareBalanceSlot = mappingSlot(from, slot);
    vaultStorage[shareBalanceSlot] = toStorageValue(generousAmount);
  }
  addressVariants(vaultAddress).forEach((addr) => {
    overrides[addr] = { storage: vaultStorage };
  });

  return overrides;
};

export async function simulateTenderly(request: SimulationRequest): Promise<SimulationResult> {
  try {
    if (!isTenderlyConfigured()) {
      return {
        success: false,
        gasEstimate: "0",
        reason: "Tenderly simulation not configured"
      };
    }

    const vaultDetail = SAMPLE_VAULT_DETAIL[request.vaultId];
    if (!vaultDetail) {
      return {
        success: false,
        gasEstimate: "0",
        reason: `Vault ${request.vaultId} not found`
      };
    }

    const vault = vaultDetail.vault;
    const decimals = ["USDC", "USDT", "BUSD"].includes(vault.asset) ? 6 : 18;
    const assets = parseUnits(request.amount, decimals);

    console.log("Tenderly simulation request:", {
      vaultId: request.vaultId,
      action: request.action,
      amount: request.amount,
      assets: assets.toString(),
      decimals,
      vault: {
        name: vault.name,
        vaultAddress: vault.vaultAddress,
        assetAddress: vault.assetAddress,
        asset: vault.asset
      }
    });

    const input =
      request.action === "deposit"
        ? encodeDepositCall(assets, request.from)
        : encodeWithdrawCall(assets, request.from, request.from);

    const stateOverrides = buildStateOverrides(
      request.from,
      vault.vaultAddress,
      vault.assetAddress,
      assets,
      request.action
    );

    console.log("State overrides count:", {
      addresses: Object.keys(stateOverrides).length,
      totalStorageSlots: Object.values(stateOverrides).reduce(
        (sum, override) => sum + (override.storage ? Object.keys(override.storage).length : 0),
        0
      )
    });

    const tenderlyClient = getTenderlyClient();
    const tenderlyResponse = await tenderlyClient.simulate({
      network_id: request.chainId.toString(),
      from: request.from,
      to: vault.vaultAddress,
      input,
      value: "0",
      save: false,
      save_if_fails: false,
      simulation_type: "full",
      state_objects: stateOverrides
    });

    if (!tenderlyResponse.transaction.status) {
      // Extract revert reason from Tenderly response
      const errorMessage =
        tenderlyResponse.transaction.error_message ||
        tenderlyResponse.transaction.error_info?.error_message ||
        tenderlyResponse.transaction.call_trace?.[0]?.error_message ||
        "Unknown error";

      // Log the full error for debugging
      console.error("Tenderly simulation reverted:", {
        vaultId: request.vaultId,
        vault: vault.name,
        action: request.action,
        amount: request.amount,
        chainId: request.chainId,
        gasUsed: tenderlyResponse.transaction.gas_used,
        errorMessage,
        errorInfo: tenderlyResponse.transaction.error_info,
        logs: tenderlyResponse.transaction.logs?.slice(0, 3) // First 3 logs for debugging
      });

      return {
        success: false,
        gasEstimate: tenderlyResponse.transaction.gas_used.toString(),
        reason: `Simulation reverted: ${errorMessage}`
      };
    }

    const balanceChanges = extractBalanceChanges(
      tenderlyResponse.transaction.logs,
      request.action,
      vault.asset,
      vault.symbol,
      request.amount
    );

    return {
      success: true,
      gasEstimate: tenderlyResponse.transaction.gas_used.toString(),
      balanceChanges
    };
  } catch (error) {
    console.error("Tenderly simulation error:", error);
    return {
      success: false,
      gasEstimate: "0",
      reason: error instanceof Error ? error.message : "Simulation failed"
    };
  }
}

function extractBalanceChanges(
  logs: Array<{ name?: string; inputs?: Array<{ name: string; value: string }> }>,
  action: "deposit" | "withdraw",
  assetSymbol: string,
  vaultSymbol: string,
  amount: string
): Array<{ asset: string; delta: string }> {
  if (action === "deposit") {
    return [
      { asset: assetSymbol, delta: `-${amount}` },
      { asset: vaultSymbol, delta: `+${amount}` }
    ];
  }

  return [
    { asset: vaultSymbol, delta: `-${amount}` },
    { asset: assetSymbol, delta: `+${amount}` }
  ];
}
