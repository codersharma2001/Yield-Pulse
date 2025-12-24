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

const addressVariants = (addr: `0x${string}`) => {
  const lower = addr.toLowerCase() as `0x${string}`;
  return Array.from(new Set([addr, lower]));
};

const buildStateOverrides = (
  from: `0x${string}`,
  vaultAddress: `0x${string}`,
  assetAddress: `0x${string}`,
  amountWei: bigint,
  action: SimulationRequest["action"]
): StateOverrides => {
  const overrides: StateOverrides = {};
  const generousAmount = amountWei * 1_000n || 10n ** 21n;
  const allowanceAmount = generousAmount;

  // Native balance for the caller
  overrides[from] = { balance: `0x${NATIVE_BALANCE.toString(16)}` };

  // Underlying ERC20 balances/allowance — seed multiple common slot layouts (0/1/2/3)
  const balanceSlots = [0n, 1n, 2n, 3n].map((slot) => mappingSlot(from, slot));
  const allowanceSlots = [1n, 2n, 3n].map((slot) => doubleMappingSlot(from, vaultAddress, slot));
  const assetOverride = {
    storage: {
      ...Object.fromEntries(balanceSlots.map((slot) => [slot, `0x${generousAmount.toString(16)}`])),
      ...Object.fromEntries(allowanceSlots.map((slot) => [slot, `0x${allowanceAmount.toString(16)}`]))
    }
  };
  addressVariants(assetAddress).forEach((addr) => {
    overrides[addr] = assetOverride;
  });

  // ERC4626 share token balance for withdraw path (assumes balances slot 0)
  const shareBalanceSlot = mappingSlot(from, 0);
  const vaultOverride = {
    storage: {
      [shareBalanceSlot]: `0x${generousAmount.toString(16)}`
    }
  };
  addressVariants(vaultAddress).forEach((addr) => {
    overrides[addr] = vaultOverride;
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
      return {
        success: false,
        gasEstimate: tenderlyResponse.transaction.gas_used.toString(),
        reason: "Transaction would revert (likely allowance/balance)"
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
