/**
 * DeFiLlama API Service
 * Fetches real-time APY and TVL data from DeFiLlama's yields endpoint
 * API Docs: https://defillama.com/docs/api
 */

import axios, { AxiosError } from "axios";

const DEFILLAMA_BASE_URL = process.env.DEFILLAMA_API_URL || "https://yields.llama.fi";
const REQUEST_TIMEOUT = 10000; // 10 seconds

// DeFiLlama Pool Response Interface
export interface DeFiLlamaPool {
  chain: string;
  project: string;
  symbol: string;
  tvlUsd: number;
  apy: number;
  apyBase?: number;
  apyReward?: number;
  apyPct1D?: number;
  apyPct7D?: number;
  apyPct30D?: number;
  stablecoin: boolean;
  ilRisk: string; // "no" | "yes"
  exposure: string; // "single" | "multi"
  pool: string; // Pool ID/Address
  poolMeta?: string;
  predictions?: {
    predictedClass: string;
    predictedProbability: number;
    binnedConfidence: number;
  };
  mu?: number;
  sigma?: number;
  count?: number;
  outlier?: boolean;
  underlyingTokens?: string[];
  rewardTokens?: string[];
}

export interface DeFiLlamaResponse {
  status: string;
  data: DeFiLlamaPool[];
}

// Normalized data for our application
export interface NormalizedPoolData {
  address: string;
  chainId: number;
  apy: number;
  apyBase: number;
  apyReward: number;
  tvlUsd: number;
  lastUpdated: string;
  source: "defillama";
}

// Chain name mapping (DeFiLlama uses different names)
const CHAIN_NAME_TO_ID: Record<string, number> = {
  ethereum: 1,
  polygon: 137,
  arbitrum: 42161,
  bsc: 56,
  // Testnets (not available in DeFiLlama)
  sepolia: 11155111,
  "polygon-amoy": 80002,
  "arbitrum-sepolia": 421614,
  "bsc-testnet": 97,
};

const CHAIN_ID_TO_NAME: Record<number, string> = {
  1: "Ethereum",
  137: "Polygon",
  42161: "Arbitrum",
  56: "Binance",
};

/**
 * DeFiLlama Service Class
 */
export class DeFiLlamaService {
  private baseUrl: string;
  private cachedPools: DeFiLlamaPool[] | null = null;
  private lastFetch: number = 0;
  private cacheDuration: number = 5 * 60 * 1000; // 5 minutes

  constructor(baseUrl: string = DEFILLAMA_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Fetch all pools from DeFiLlama
   */
  async fetchPools(): Promise<DeFiLlamaPool[]> {
    // Return cached data if fresh
    const now = Date.now();
    if (this.cachedPools && now - this.lastFetch < this.cacheDuration) {
      console.log("[DeFiLlama] Returning cached pools");
      return this.cachedPools;
    }

    try {
      console.log("[DeFiLlama] Fetching pools from API...");
      const response = await axios.get<DeFiLlamaResponse>(`${this.baseUrl}/pools`, {
        timeout: REQUEST_TIMEOUT,
        headers: {
          "Accept": "application/json",
        },
      });

      if (response.data && Array.isArray(response.data.data)) {
        this.cachedPools = response.data.data;
        this.lastFetch = now;
        console.log(`[DeFiLlama] Fetched ${this.cachedPools.length} pools`);
        return this.cachedPools;
      }

      throw new Error("Invalid response format from DeFiLlama");
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        console.error(`[DeFiLlama] API Error: ${axiosError.message}`);
        if (axiosError.response) {
          console.error(
            `[DeFiLlama] Response status: ${axiosError.response.status}`
          );
        }
      } else {
        console.error(`[DeFiLlama] Unexpected error:`, error);
      }

      // Return cached data if available, even if stale
      if (this.cachedPools) {
        console.log("[DeFiLlama] Returning stale cached data");
        return this.cachedPools;
      }

      throw error;
    }
  }

  /**
   * Get pools for specific chains
   */
  async getPoolsByChains(chainIds: number[]): Promise<DeFiLlamaPool[]> {
    const pools = await this.fetchPools();
    const chainNames = chainIds
      .map((id) => CHAIN_ID_TO_NAME[id]?.toLowerCase())
      .filter(Boolean);

    return pools.filter((pool) =>
      chainNames.includes(pool.chain.toLowerCase())
    );
  }

  /**
   * Get pool data by vault address
   */
  async getPoolByAddress(
    chainId: number,
    vaultAddress: string
  ): Promise<DeFiLlamaPool | null> {
    const pools = await this.fetchPools();
    const chainName = CHAIN_ID_TO_NAME[chainId]?.toLowerCase();

    if (!chainName) {
      console.warn(`[DeFiLlama] Unknown chain ID: ${chainId}`);
      return null;
    }

    const normalizedAddress = vaultAddress.toLowerCase();

    // Try to find pool by address
    const pool = pools.find(
      (p) =>
        p.chain.toLowerCase() === chainName &&
        (p.pool?.toLowerCase() === normalizedAddress ||
          p.underlyingTokens?.some((t) => t.toLowerCase() === normalizedAddress))
    );

    return pool || null;
  }

  /**
   * Get pools for specific protocols
   */
  async getPoolsByProtocols(protocols: string[]): Promise<DeFiLlamaPool[]> {
    const pools = await this.fetchPools();
    const normalizedProtocols = protocols.map((p) => p.toLowerCase());

    return pools.filter((pool) =>
      normalizedProtocols.includes(pool.project.toLowerCase())
    );
  }

  /**
   * Normalize pool data for our application
   * DeFiLlama returns APY as percentage (10.13 = 10.13%), we need decimal (0.1013 = 10.13%)
   */
  normalizePoolData(
    pool: DeFiLlamaPool,
    chainId: number
  ): NormalizedPoolData | null {
    try {
      return {
        address: pool.pool.toLowerCase(),
        chainId,
        apy: (pool.apy || 0) / 100, // Convert percentage to decimal
        apyBase: (pool.apyBase || 0) / 100,
        apyReward: (pool.apyReward || 0) / 100,
        tvlUsd: pool.tvlUsd || 0,
        lastUpdated: new Date().toISOString(),
        source: "defillama",
      };
    } catch (error) {
      console.error("[DeFiLlama] Error normalizing pool data:", error);
      return null;
    }
  }

  /**
   * Get normalized data for a specific vault
   */
  async getVaultData(
    chainId: number,
    vaultAddress: string
  ): Promise<NormalizedPoolData | null> {
    const pool = await this.getPoolByAddress(chainId, vaultAddress);
    if (!pool) {
      return null;
    }
    return this.normalizePoolData(pool, chainId);
  }

  /**
   * Batch get vault data for multiple addresses
   */
  async getMultipleVaultData(
    vaults: Array<{ chainId: number; address: string }>
  ): Promise<Map<string, NormalizedPoolData>> {
    const pools = await this.fetchPools();
    const result = new Map<string, NormalizedPoolData>();

    for (const vault of vaults) {
      const chainName = CHAIN_ID_TO_NAME[vault.chainId]?.toLowerCase();
      if (!chainName) continue;

      const normalizedAddress = vault.address.toLowerCase();
      const pool = pools.find(
        (p) =>
          p.chain.toLowerCase() === chainName &&
          (p.pool?.toLowerCase() === normalizedAddress ||
            p.underlyingTokens?.some((t) => t.toLowerCase() === normalizedAddress))
      );

      if (pool) {
        const normalized = this.normalizePoolData(pool, vault.chainId);
        if (normalized) {
          const key = `${vault.chainId}:${vault.address.toLowerCase()}`;
          result.set(key, normalized);
        }
      }
    }

    console.log(
      `[DeFiLlama] Found data for ${result.size}/${vaults.length} vaults`
    );
    return result;
  }

  /**
   * Clear cache (useful for testing or manual refresh)
   */
  clearCache(): void {
    this.cachedPools = null;
    this.lastFetch = 0;
    console.log("[DeFiLlama] Cache cleared");
  }
}

// Export singleton instance
export const defillamaService = new DeFiLlamaService();
