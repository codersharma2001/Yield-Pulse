import type {
  SimulationResult,
  UserPositionsResponse,
  VaultDetailResponse,
  VaultListResponse,
  VaultListItem,
  VaultSnapshotPoint
} from "./index";

export type NetworkEnvironment = "mainnet" | "testnet";

/**
 * Creates a simple hash from a string for seeding
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

/**
 * Creates a seeded pseudo-random number generator (Mulberry32 algorithm)
 * Returns a function that generates deterministic random numbers [0, 1)
 */
function createSeededRandom(seed: number): () => number {
  let state = seed;
  return function() {
    state += 0x6D2B79F5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Daily volatility levels by risk profile
 * These values represent realistic DeFi yield fluctuations
 */
const RISK_VOLATILITY: Record<"low" | "medium" | "high", number> = {
  low: 0.0008,    // ±0.08% daily swing for stable protocols
  medium: 0.0015, // ±0.15% daily swing for moderate risk
  high: 0.0030    // ±0.30% daily swing for high yield strategies
};

/**
 * Mean reversion factor for realistic APY behavior
 * Higher values = faster return to mean APY
 */
const MEAN_REVERSION = 0.15;

/**
 * Number of days of historical data
 */
const DAYS_OF_HISTORY = 30;

/**
 * Generates realistic APY snapshots that match vault's d7 and d30 averages
 * Uses a mean-reverting random walk to simulate realistic yield fluctuations
 */
function generateApySnapshots(vault: VaultListItem): VaultSnapshotPoint[] {
  const seed = hashString(vault.id);
  const random = createSeededRandom(seed);
  const volatility = RISK_VOLATILITY[vault.risk];
  const meanApy = vault.apy.d30;

  const now = Date.now();
  const snapshots: VaultSnapshotPoint[] = [];
  let currentApy = meanApy;

  for (let i = DAYS_OF_HISTORY; i >= 0; i--) {
    const timestamp = now - i * 24 * 60 * 60 * 1000;

    // Mean-reverting random walk
    const randomShock = (random() - 0.5) * 2 * volatility;
    const meanReversionTerm = (meanApy - currentApy) * MEAN_REVERSION;
    currentApy += randomShock + meanReversionTerm;

    // Ensure APY stays realistic (non-negative and reasonable)
    currentApy = Math.max(0.001, Math.min(currentApy, 0.5));

    snapshots.push({ t: timestamp, v: currentApy });
  }

  return snapshots;
}

/**
 * Generates TVL snapshots with realistic variation
 */
function generateTvlSnapshots(baseTvl: number, seed: number): VaultSnapshotPoint[] {
  const random = createSeededRandom(seed + 42);
  const now = Date.now();
  const snapshots: VaultSnapshotPoint[] = [];

  for (let i = DAYS_OF_HISTORY; i >= 0; i--) {
    const timestamp = now - i * 24 * 60 * 60 * 1000;
    const variation = (random() - 0.5) * 0.2; // ±10% variation
    const tvl = baseTvl * (1 + variation);

    snapshots.push({
      t: timestamp,
      v: Math.max(0, tvl)
    });
  }

  return snapshots;
}

/**
 * Creates snapshot data for a vault's historical metrics
 */
const makeSnapshots = (vault: VaultListItem): VaultDetailResponse["snapshots"] => {
  const seed = hashString(vault.id);

  return {
    apy: generateApySnapshots(vault),
    tvl: generateTvlSnapshots(vault.tvlUsd, seed)
  };
};

const TESTNET_VAULTS: VaultListResponse = {
  asOf: Math.floor(Date.now() / 1000),
  vaults: [
    {
      id: "1:0x83f20f44975d03b1b09e64809b757c47f942beea",
      chainId: 1,
      asset: "DAI",
      protocolId: "spark",
      protocolMetadata: {
        name: "Spark Protocol",
        websiteUrl: "https://spark.fi",
        vaultUrl: "https://app.spark.fi/sdai"
      },
      name: "sDAI (Maker Savings DAI)",
      symbol: "sDAI",
      vaultAddress: "0x83f20f44975d03b1b09e64809b757c47f942beea",
      assetAddress: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
      apy: { d7: 0.05, d30: 0.048 },
      tvlUsd: 1_245_000,
      capUsd: 50_000_000,
      utilization: 0.62,
      risk: "low",
      lastUpdated: new Date().toISOString()
    },
    {
      id: "1:0xac3e018457b222d93114458476f3e3416abbe38f",
      chainId: 1,
      asset: "frxETH",
      protocolId: "frax",
      protocolMetadata: {
        name: "Frax Finance",
        websiteUrl: "https://frax.finance",
        vaultUrl: "https://app.frax.finance/sfrxeth"
      },
      name: "sfrxETH (Frax Staked frxETH)",
      symbol: "sfrxETH",
      vaultAddress: "0xac3E018457B222d93114458476f3E3416Abbe38F",
      assetAddress: "0x5E8422345238F34275888049021821E8E08CAa1f",
      apy: { d7: 0.085, d30: 0.081 },
      tvlUsd: 856_000,
      capUsd: 10_000_000,
      utilization: 0.41,
      risk: "medium",
      lastUpdated: new Date().toISOString()
    },
    {
      id: "1:0xdd0f28e19c1780eb6396170735d45153d261490d",
      chainId: 1,
      asset: "USDC",
      protocolId: "morpho",
      protocolMetadata: {
        name: "Morpho",
        websiteUrl: "https://morpho.org",
        vaultUrl: "https://app.morpho.org/vault?vault=0xdd0f28e19c1780eb6396170735d45153d261490d&network=ethereum"
      },
      name: "Morpho — Gauntlet USDC Prime (GTUSDC)",
      symbol: "GTUSDC",
      vaultAddress: "0xdd0f28e19C1780eb6396170735D45153D261490d",
      assetAddress: "0xA0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
      apy: { d7: 0.046, d30: 0.044 },
      tvlUsd: 6_200_000,
      capUsd: 25_000_000,
      utilization: 0.52,
      risk: "medium",
      lastUpdated: new Date().toISOString()
    },
    {
      id: "1:0xbeef01735c132ada46aa9aa4c54623caa92a64cb",
      chainId: 1,
      asset: "USDC",
      protocolId: "morpho",
      protocolMetadata: {
        name: "Morpho",
        websiteUrl: "https://morpho.org",
        vaultUrl: "https://app.morpho.org/vault?vault=0xbeef01735c132ada46aa9aa4c54623caa92a64cb&network=ethereum"
      },
      name: "Morpho — Steakhouse USDC (steakUSDC)",
      symbol: "steakUSDC",
      vaultAddress: "0xBEEF01735c132Ada46AA9aA4c54623cAA92A64CB",
      assetAddress: "0xA0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
      apy: { d7: 0.051, d30: 0.049 },
      tvlUsd: 4_150_000,
      capUsd: 20_000_000,
      utilization: 0.39,
      risk: "medium",
      lastUpdated: new Date().toISOString()
    },
    {
      id: "1:0x79fd640000f8563a866322483524a4b48f1ed702",
      chainId: 1,
      asset: "USDT",
      protocolId: "morpho",
      protocolMetadata: {
        name: "Morpho",
        websiteUrl: "https://morpho.org",
        vaultUrl: "https://app.morpho.org/vault?vault=0x79fd640000f8563a866322483524a4b48f1ed702&network=ethereum"
      },
      name: "Morpho — Gauntlet USDT Core",
      symbol: "gUSDT",
      vaultAddress: "0x79FD640000F8563A866322483524a4b48f1Ed702",
      assetAddress: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
      apy: { d7: 0.043, d30: 0.042 },
      tvlUsd: 3_800_000,
      capUsd: 18_000_000,
      utilization: 0.47,
      risk: "medium",
      lastUpdated: new Date().toISOString()
    },
    {
      id: "1:0x2371e134e3455e0593363cbf89d3b6cf53740618",
      chainId: 1,
      asset: "WETH",
      protocolId: "morpho",
      protocolMetadata: {
        name: "Morpho",
        websiteUrl: "https://morpho.org",
        vaultUrl: "https://app.morpho.org/vault?vault=0x2371e134e3455e0593363cbf89d3b6cf53740618&network=ethereum"
      },
      name: "Morpho — Gauntlet WETH Prime",
      symbol: "gWETH",
      vaultAddress: "0x2371e134e3455e0593363cBF89d3b6cf53740618",
      assetAddress: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
      apy: { d7: 0.062, d30: 0.059 },
      tvlUsd: 9_750_000,
      capUsd: 40_000_000,
      utilization: 0.36,
      risk: "medium",
      lastUpdated: new Date().toISOString()
    },
    {
      id: "1:0x500331c9ff24d9d11aee6b07734aa72343ea74a5",
      chainId: 1,
      asset: "DAI",
      protocolId: "morpho",
      protocolMetadata: {
        name: "Morpho",
        websiteUrl: "https://morpho.org",
        vaultUrl: "https://app.morpho.org/vault?vault=0x500331c9ff24d9d11aee6b07734aa72343ea74a5&network=ethereum"
      },
      name: "Morpho — Gauntlet DAI Core",
      symbol: "gDAI",
      vaultAddress: "0x500331c9fF24D9d11aee6B07734Aa72343EA74a5",
      assetAddress: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
      apy: { d7: 0.039, d30: 0.038 },
      tvlUsd: 5_600_000,
      capUsd: 22_000_000,
      utilization: 0.51,
      risk: "low",
      lastUpdated: new Date().toISOString()
    }
  ]
};

const MAINNET_VAULTS: VaultListResponse = {
  asOf: Math.floor(Date.now() / 1000),
  vaults: [
    ...TESTNET_VAULTS.vaults
  ]
};

const ALL_VAULTS: VaultListItem[] = [...TESTNET_VAULTS.vaults, ...MAINNET_VAULTS.vaults];

const DETAIL_BY_ID: Record<string, VaultDetailResponse> = ALL_VAULTS.reduce((acc, vault) => {
  acc[vault.id] = {
    vault,
    snapshots: makeSnapshots(vault)
  };
  return acc;
}, {} as Record<string, VaultDetailResponse>);

export const SAMPLE_VAULT_DETAIL = DETAIL_BY_ID;
export const SAMPLE_VAULTS_MAP: Record<NetworkEnvironment, VaultListResponse> = {
  testnet: TESTNET_VAULTS,
  mainnet: MAINNET_VAULTS
};

// Export snapshot generation function for use with real vault data
export const generateSnapshots = makeSnapshots;

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
    { asset: "DAI", delta: "-1000" },
    { asset: "sDAI", delta: "+995" }
  ]
};

export const SAMPLE_SIMULATION_FAIL: SimulationResult = {
  success: false,
  gasEstimate: "210000",
  reason: "Slippage exceeds configured threshold"
};
