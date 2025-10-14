import type {
  SimulationResult,
  UserPositionsResponse,
  VaultDetailResponse,
  VaultListResponse
} from "./index";

export type NetworkEnvironment = "mainnet" | "testnet";

const makeSnapshots = (tvlBase: number): VaultDetailResponse["snapshots"] => ({
  apy: Array.from({ length: 14 }).map((_, idx) => ({
    t: Math.floor(Date.now() / 1000) - idx * 86_400,
    v: 0.03 + Math.sin(idx / 3) * 0.002
  })),
  tvl: Array.from({ length: 14 }).map((_, idx) => ({
    t: Math.floor(Date.now() / 1000) - idx * 86_400,
    v: tvlBase + Math.cos(idx / 4) * (tvlBase * 0.04)
  }))
});

const TESTNET_VAULTS: VaultListResponse = {
  asOf: Math.floor(Date.now() / 1000),
  vaults: [
    {
      id: "421614:0xvaulta",
      chainId: 421_614,
      asset: "USDC",
      protocolId: "aave",
      name: "USDC Aave v3 (Arbitrum Sepolia)",
      symbol: "yvUSDC",
      vaultAddress: "0x1111111111111111111111111111111111111111",
      assetAddress: "0x2222222222222222222222222222222222222222",
      apy: { d7: 0.0342, d30: 0.0298 },
      tvlUsd: 1_245_000,
      capUsd: 5_000_000,
      utilization: 0.44,
      risk: "medium",
      lastUpdated: new Date().toISOString()
    },
    {
      id: "11155111:0xvaultb",
      chainId: 11_155_111,
      asset: "ETH",
      protocolId: "pendle",
      name: "WETH Pendle LRT (Sepolia)",
      symbol: "yvWETH",
      vaultAddress: "0x3333333333333333333333333333333333333333",
      assetAddress: "0x4444444444444444444444444444444444444444",
      apy: { d7: 0.0821, d30: 0.0755 },
      tvlUsd: 856_000,
      capUsd: 2_500_000,
      utilization: 0.61,
      risk: "high",
      lastUpdated: new Date().toISOString()
    },
    {
      id: "80002:0xvaultc",
      chainId: 80_002,
      asset: "USDT",
      protocolId: "curve",
      name: "USDT Curve LP (Polygon Amoy)",
      symbol: "yvUSDT",
      vaultAddress: "0x5555555555555555555555555555555555555555",
      assetAddress: "0x6666666666666666666666666666666666666666",
      apy: { d7: 0.045, d30: 0.041 },
      tvlUsd: 640_000,
      capUsd: 3_000_000,
      utilization: 0.32,
      risk: "medium",
      lastUpdated: new Date().toISOString()
    },
    {
      id: "97:0xvaultd",
      chainId: 97,
      asset: "BUSD",
      protocolId: "aave",
      name: "BUSD Aave Reserve (BSC Testnet)",
      symbol: "yvBUSD",
      vaultAddress: "0x7777777777777777777777777777777777777777",
      assetAddress: "0x8888888888888888888888888888888888888888",
      apy: { d7: 0.027, d30: 0.025 },
      tvlUsd: 420_000,
      capUsd: 2_000_000,
      utilization: 0.21,
      risk: "low",
      lastUpdated: new Date().toISOString()
    }
  ]
};

const MAINNET_VAULTS: VaultListResponse = {
  asOf: Math.floor(Date.now() / 1000),
  vaults: [
    {
      id: "1:0xvault1",
      chainId: 1,
      asset: "USDC",
      protocolId: "aave",
      name: "USDC Aave Prime (Ethereum)",
      symbol: "yvUSDC",
      vaultAddress: "0x9999999999999999999999999999999999999999",
      assetAddress: "0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
      apy: { d7: 0.0295, d30: 0.0281 },
      tvlUsd: 12_450_000,
      capUsd: 50_000_000,
      utilization: 0.58,
      risk: "medium",
      lastUpdated: new Date().toISOString()
    },
    {
      id: "137:0xvault2",
      chainId: 137,
      asset: "USDT",
      protocolId: "curve",
      name: "USDT Curve Tricrypto (Polygon)",
      symbol: "yvUSDT",
      vaultAddress: "0xBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB",
      assetAddress: "0xCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC",
      apy: { d7: 0.042, d30: 0.0405 },
      tvlUsd: 8_320_000,
      capUsd: 25_000_000,
      utilization: 0.33,
      risk: "medium",
      lastUpdated: new Date().toISOString()
    },
    {
      id: "56:0xvault3",
      chainId: 56,
      asset: "BUSD",
      protocolId: "aave",
      name: "BUSD Passive Yield (BNB Chain)",
      symbol: "yvBUSD",
      vaultAddress: "0xDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD",
      assetAddress: "0xEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE",
      apy: { d7: 0.021, d30: 0.0198 },
      tvlUsd: 6_540_000,
      capUsd: 18_000_000,
      utilization: 0.36,
      risk: "low",
      lastUpdated: new Date().toISOString()
    },
    {
      id: "42161:0xvault4",
      chainId: 42_161,
      asset: "ETH",
      protocolId: "pendle",
      name: "ETH Pendle PT (Arbitrum)",
      symbol: "yvETH",
      vaultAddress: "0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
      assetAddress: "0x1234123412341234123412341234123412341234",
      apy: { d7: 0.062, d30: 0.058 },
      tvlUsd: 9_750_000,
      capUsd: 30_000_000,
      utilization: 0.41,
      risk: "medium",
      lastUpdated: new Date().toISOString()
    }
  ]
};

const DETAIL_BY_ID: Record<string, VaultDetailResponse> = {};

for (const vault of [...TESTNET_VAULTS.vaults, ...MAINNET_VAULTS.vaults]) {
  DETAIL_BY_ID[vault.id] = { vault, snapshots: makeSnapshots(vault.tvlUsd) };
}

export const SAMPLE_VAULTS_MAP: Record<NetworkEnvironment, VaultListResponse> = {
  testnet: TESTNET_VAULTS,
  mainnet: MAINNET_VAULTS
};

export const SAMPLE_VAULT_DETAIL = DETAIL_BY_ID;

export const SAMPLE_POSITIONS: UserPositionsResponse = {
  address: "0x000000000000000000000000000000000000dEaD",
  asOf: Math.floor(Date.now() / 1000),
  positions: [
    {
      vaultId: TESTNET_VAULTS.vaults[0].id,
      shares: 123.45,
      assets: 120.12,
      entryValueUsd: 118_000,
      currentValueUsd: 120_800,
      pnlUsd: 2_800
    }
  ]
};

export const SAMPLE_SIMULATION_OK: SimulationResult = {
  success: true,
  gasEstimate: "210000",
  balanceChanges: [
    { asset: "USDC", delta: "-1000" },
    { asset: "yvUSDC", delta: "+995" }
  ]
};

export const SAMPLE_SIMULATION_FAIL: SimulationResult = {
  success: false,
  gasEstimate: "210000",
  reason: "Slippage exceeds configured threshold"
};
