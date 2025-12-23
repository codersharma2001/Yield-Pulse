/**
 * Vault Aggregator Service
 * Orchestrates data from multiple sources to create complete vault information
 */

import { VaultListItem, createVaultId } from "@yield-dashboard/sdk";
import {
  VAULT_REGISTRY,
  getVaultsByChain,
  getVaultByAddress,
  type VaultRegistryEntry,
} from "../data/vault-registry.js";
import {
  getProtocolMetadata,
  getVaultUrl,
  getProtocolAuditScore,
} from "../data/protocol-metadata.js";
import { defillamaService, type NormalizedPoolData } from "./defillama-service.js";
import { cache } from "./cache.js";

const CACHE_KEY_PREFIX = "vaults";
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export class VaultAggregatorService {
  /**
   * Get all vaults with live data
   */
  async getVaults(env: "testnet" | "mainnet" = "mainnet"): Promise<VaultListItem[]> {
    const cacheKey = `${CACHE_KEY_PREFIX}:all:${env}`;

    // Try cache first
    const cached = cache.get<VaultListItem[]>(cacheKey);
    if (cached) {
      console.log(`[VaultAggregator] Returning cached vaults for ${env}`);
      return cached;
    }

    try {
      // Only fetch for mainnet (testnets not supported by DeFiLlama)
      if (env === "testnet") {
        const testnetVaults = this.getTestnetVaults();
        cache.set(cacheKey, testnetVaults, CACHE_TTL);
        return testnetVaults;
      }

      // Fetch live data for mainnet
      const vaults = await this.fetchLiveVaults();
      cache.set(cacheKey, vaults, CACHE_TTL);
      return vaults;
    } catch (error) {
      console.error("[VaultAggregator] Error fetching vaults:", error);

      // Fallback to static data
      console.log("[VaultAggregator] Falling back to static registry data");
      return this.getStaticVaults();
    }
  }

  /**
   * Get a specific vault by ID
   */
  async getVault(vaultId: string, env: "testnet" | "mainnet" = "mainnet"): Promise<VaultListItem | null> {
    const [chainIdStr, address] = vaultId.split(":");
    const chainId = parseInt(chainIdStr, 10);

    const cacheKey = `${CACHE_KEY_PREFIX}:single:${vaultId}:${env}`;

    // Try cache first
    const cached = cache.get<VaultListItem>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const registryEntry = getVaultByAddress(chainId, address);
      if (!registryEntry) {
        return null;
      }

      const vault = await this.buildVaultItem(registryEntry, env === "mainnet");
      if (vault) {
        cache.set(cacheKey, vault, CACHE_TTL);
      }
      return vault;
    } catch (error) {
      console.error(`[VaultAggregator] Error fetching vault ${vaultId}:`, error);
      return null;
    }
  }

  /**
   * Fetch vaults with live data from DeFiLlama
   */
  private async fetchLiveVaults(): Promise<VaultListItem[]> {
    console.log("[VaultAggregator] Fetching live vault data...");

    // Prepare vault addresses for batch lookup
    const vaultAddresses = VAULT_REGISTRY.map((v) => ({
      chainId: v.chainId,
      address: v.vaultAddress,
    }));

    // Fetch live data in batch
    const liveDataMap = await defillamaService.getMultipleVaultData(vaultAddresses);

    // Build vault items
    const vaults: VaultListItem[] = [];
    for (const registryEntry of VAULT_REGISTRY) {
      const key = `${registryEntry.chainId}:${registryEntry.vaultAddress.toLowerCase()}`;
      const liveData = liveDataMap.get(key);

      const vault = this.buildVaultItemFromRegistry(registryEntry, liveData);
      if (vault) {
        vaults.push(vault);
      }
    }

    console.log(`[VaultAggregator] Built ${vaults.length} vault items`);
    return vaults;
  }

  /**
   * Build a single vault item with optional live data
   */
  private async buildVaultItem(
    registryEntry: VaultRegistryEntry,
    fetchLive: boolean = true
  ): Promise<VaultListItem | null> {
    let liveData: NormalizedPoolData | null = null;

    if (fetchLive) {
      liveData = await defillamaService.getVaultData(
        registryEntry.chainId,
        registryEntry.vaultAddress
      );
    }

    return this.buildVaultItemFromRegistry(registryEntry, liveData);
  }

  /**
   * Build a VaultListItem from registry entry and optional live data
   */
  private buildVaultItemFromRegistry(
    entry: VaultRegistryEntry,
    liveData: NormalizedPoolData | null
  ): VaultListItem | null {
    const protocol = getProtocolMetadata(entry.protocolId);
    if (!protocol) {
      console.warn(`[VaultAggregator] Protocol not found: ${entry.protocolId}`);
      return null;
    }

    const vaultUrl = getVaultUrl(
      entry.protocolId,
      entry.chainId,
      entry.vaultAddress,
      entry.assetAddress
    );

    // Use live data if available, otherwise use placeholder values
    const apy = liveData
      ? {
          d7: liveData.apy,
          d30: liveData.apy,
        }
      : {
          d7: this.getPlaceholderAPY(entry.riskCategory),
          d30: this.getPlaceholderAPY(entry.riskCategory),
        };

    const tvlUsd = liveData?.tvlUsd || this.getPlaceholderTVL(entry.riskCategory);

    return {
      // Metadata
      id: createVaultId(entry.chainId, entry.vaultAddress),
      chainId: entry.chainId,
      asset: this.getAssetSymbol(entry.assetAddress, entry.chainId),
      protocolId: entry.protocolId,
      protocolMetadata: {
        name: protocol.name,
        websiteUrl: protocol.websiteUrl,
        vaultUrl,
      },
      name: entry.name,
      symbol: entry.symbol,
      vaultAddress: entry.vaultAddress,
      assetAddress: entry.assetAddress,

      // Metrics
      apy,
      tvlUsd,
      capUsd: tvlUsd * 1.2, // Assume 20% headroom for capacity
      utilization: 0.75 + Math.random() * 0.2, // 75-95%
      risk: entry.riskCategory,
      lastUpdated: liveData?.lastUpdated || new Date().toISOString(),
    };
  }

  /**
   * Get vaults with static data (fallback)
   */
  private getStaticVaults(): VaultListItem[] {
    return VAULT_REGISTRY.map((entry) =>
      this.buildVaultItemFromRegistry(entry, null)
    ).filter((v): v is VaultListItem => v !== null);
  }

  /**
   * Get testnet vaults (static placeholders since DeFiLlama doesn't support testnets)
   */
  private getTestnetVaults(): VaultListItem[] {
    // Return a few example testnet vaults for testing
    // In production, you'd maintain a separate testnet registry
    const testnetChainIds = [11155111, 80002, 421614, 97]; // Sepolia, Polygon Amoy, Arb Sepolia, BSC Testnet

    const protocol = getProtocolMetadata("morpho");
    if (!protocol) return [];

    return testnetChainIds.map((chainId, index) => ({
      id: createVaultId(chainId, `0x${index.toString(16).padStart(40, "0")}`),
      chainId,
      asset: "USDC",
      protocolId: "morpho",
      protocolMetadata: {
        name: protocol.name,
        websiteUrl: protocol.websiteUrl,
        vaultUrl: protocol.websiteUrl,
      },
      name: `Testnet USDC Vault`,
      symbol: "testUSDC",
      vaultAddress: `0x${index.toString(16).padStart(40, "0")}` as `0x${string}`,
      assetAddress: `0x${"1".repeat(40)}` as `0x${string}`,
      apy: { d7: 5.0, d30: 5.0 },
      tvlUsd: 100000,
      capUsd: 120000,
      utilization: 0.8,
      risk: "low" as const,
      lastUpdated: new Date().toISOString(),
    }));
  }

  /**
   * Helper: Get asset symbol from address
   */
  private getAssetSymbol(assetAddress: string, chainId: number): string {
    // Common asset addresses
    const assetMap: Record<string, string> = {
      // DAI
      "0x6b175474e89094c44da98b954eedeac495271d0f": "DAI",
      "0x8f3cf7ad23cd3cadbd9735aff958023239c6a063": "DAI", // Polygon
      "0xda10009cbd5d07dd0cecc66161fc93d7c9000da1": "DAI", // Arbitrum

      // USDC
      "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48": "USDC",
      "0x2791bca1f2de4661ed88a30c99a7a9449aa84174": "USDC.e", // Polygon
      "0xff970a61a04b1ca14834a43f5de4533ebddb5cc8": "USDC.e", // Arbitrum
      "0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d": "USDC", // BSC

      // USDT
      "0xdac17f958d2ee523a2206206994597c13d831ec7": "USDT",
      "0xc2132d05d31c914a87c6611c10748aeb04b58e8f": "USDT", // Polygon
      "0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9": "USDT", // Arbitrum
      "0x55d398326f99059ff775485246999027b3197955": "USDT", // BSC

      // WETH
      "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2": "WETH",
      "0x7ceb23fd6bc0add59e62ac25578270cff1b9f619": "WETH", // Polygon
      "0x82af49447d8a07e3bd95bd0d56f35241523fbab1": "WETH", // Arbitrum
      "0x2170ed0880ac9a755fd29b2688956bd959f933f8": "WETH", // BSC

      // Other
      "0x5e8422345238f34275888049021821e8e08caa1f": "frxETH",
      "0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c": "WBNB", // BSC
      "0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270": "WMATIC", // Polygon
    };

    return assetMap[assetAddress.toLowerCase()] || "UNKNOWN";
  }

  /**
   * Helper: Get placeholder APY based on risk (returns decimal: 0.05 = 5%)
   */
  private getPlaceholderAPY(risk: "low" | "medium" | "high"): number {
    switch (risk) {
      case "low":
        return 0.03 + Math.random() * 0.02; // 3-5%
      case "medium":
        return 0.05 + Math.random() * 0.05; // 5-10%
      case "high":
        return 0.10 + Math.random() * 0.10; // 10-20%
    }
  }

  /**
   * Helper: Get placeholder TVL based on risk
   */
  private getPlaceholderTVL(risk: "low" | "medium" | "high"): number {
    switch (risk) {
      case "low":
        return 10000000 + Math.random() * 50000000; // $10M-$60M
      case "medium":
        return 5000000 + Math.random() * 20000000; // $5M-$25M
      case "high":
        return 1000000 + Math.random() * 10000000; // $1M-$11M
    }
  }

  /**
   * Clear all vault caches
   */
  clearCache(): void {
    cache.invalidatePattern(CACHE_KEY_PREFIX);
    console.log("[VaultAggregator] Cache cleared");
  }
}

// Export singleton instance
export const vaultAggregator = new VaultAggregatorService();
