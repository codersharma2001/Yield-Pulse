/**
 * Protocol metadata including branding, URLs, and vault link templates
 */

export interface ProtocolMetadata {
  id: string;
  name: string;
  description: string;
  logoUrl: string;
  websiteUrl: string;
  appUrl: string;
  vaultUrlTemplate: string; // Template with {chainId} and {vaultAddress} placeholders
  docsUrl: string;
  auditScore: number; // 0-10, used for risk scoring
  tags: string[];
}

export const PROTOCOL_METADATA: Record<string, ProtocolMetadata> = {
  morpho: {
    id: "morpho",
    name: "Morpho",
    description:
      "Morpho is a lending protocol optimizer that improves rates on lending protocols like Aave and Compound by matching lenders and borrowers peer-to-peer",
    logoUrl: "https://app.morpho.org/favicon.ico",
    websiteUrl: "https://morpho.org",
    appUrl: "https://app.morpho.org",
    vaultUrlTemplate: "https://app.morpho.org/vault?vault={vaultAddress}&network={chainName}",
    docsUrl: "https://docs.morpho.org",
    auditScore: 9, // Highly audited by leading firms
    tags: ["lending", "optimizer", "audited", "institutional"],
  },

  spark: {
    id: "spark",
    name: "Spark Protocol",
    description:
      "Spark Protocol is the DeFi arm of MakerDAO, offering the DAI Savings Rate (DSR) and lending products",
    logoUrl: "https://app.spark.fi/icons/spark-icon.svg",
    websiteUrl: "https://spark.fi",
    appUrl: "https://app.spark.fi",
    vaultUrlTemplate: "https://app.spark.fi/sdai",
    docsUrl: "https://docs.spark.fi",
    auditScore: 9, // MakerDAO-backed, highly secure
    tags: ["makerdao", "savings", "dai", "audited"],
  },

  frax: {
    id: "frax",
    name: "Frax Finance",
    description:
      "Frax is a fractional-algorithmic stablecoin protocol with liquid staking derivatives",
    logoUrl: "https://app.frax.finance/favicon.ico",
    websiteUrl: "https://frax.finance",
    appUrl: "https://app.frax.finance",
    vaultUrlTemplate: "https://app.frax.finance/sfrxeth",
    docsUrl: "https://docs.frax.finance",
    auditScore: 8,
    tags: ["stablecoin", "liquid-staking", "eth", "audited"],
  },

  yearn: {
    id: "yearn",
    name: "Yearn Finance",
    description:
      "Yearn Finance is a suite of DeFi products providing yield aggregation, lending, and insurance",
    logoUrl: "https://yearn.finance/favicon.ico",
    websiteUrl: "https://yearn.finance",
    appUrl: "https://yearn.finance",
    vaultUrlTemplate: "https://yearn.finance/vaults/{chainId}/{vaultAddress}",
    docsUrl: "https://docs.yearn.finance",
    auditScore: 8, // Well-established, multiple audits
    tags: ["yield-aggregator", "vaults", "blue-chip", "audited"],
  },

  beefy: {
    id: "beefy",
    name: "Beefy Finance",
    description:
      "Beefy is a multi-chain yield optimizer that auto-compounds rewards from various DeFi protocols",
    logoUrl: "https://app.beefy.finance/favicon.png",
    websiteUrl: "https://beefy.finance",
    appUrl: "https://app.beefy.finance",
    vaultUrlTemplate: "https://app.beefy.finance/vault/{vaultId}", // Note: Uses vault slug, not address
    docsUrl: "https://docs.beefy.finance",
    auditScore: 7, // Audited, but more vaults = higher surface area
    tags: ["yield-aggregator", "multi-chain", "auto-compound", "audited"],
  },

  venus: {
    id: "venus",
    name: "Venus Protocol",
    description:
      "Venus is an algorithmic money market and synthetic stablecoin protocol on BSC",
    logoUrl: "https://venus.io/favicon.ico",
    websiteUrl: "https://venus.io",
    appUrl: "https://app.venus.io",
    vaultUrlTemplate: "https://app.venus.io/market/{vaultAddress}",
    docsUrl: "https://docs.venus.io",
    auditScore: 7, // Established BSC protocol
    tags: ["lending", "borrowing", "bsc", "audited"],
  },

  aave: {
    id: "aave",
    name: "Aave",
    description:
      "Aave is a decentralized lending protocol where users can lend and borrow cryptocurrencies",
    logoUrl: "https://app.aave.com/favicon.ico",
    websiteUrl: "https://aave.com",
    appUrl: "https://app.aave.com",
    vaultUrlTemplate: "https://app.aave.com/reserve-overview/?underlyingAsset={assetAddress}&marketName=proto_{chainName}_v3",
    docsUrl: "https://docs.aave.com",
    auditScore: 10, // Most audited DeFi protocol
    tags: ["lending", "borrowing", "blue-chip", "audited", "institutional"],
  },
};

// Helper functions
export function getProtocolMetadata(protocolId: string): ProtocolMetadata | undefined {
  return PROTOCOL_METADATA[protocolId];
}

export function getAllProtocols(): ProtocolMetadata[] {
  return Object.values(PROTOCOL_METADATA);
}

/**
 * Generate a direct vault URL for a given protocol, chain, and vault address
 */
export function getVaultUrl(
  protocolId: string,
  chainId: number,
  vaultAddress: string,
  assetAddress?: string
): string {
  const protocol = PROTOCOL_METADATA[protocolId];
  if (!protocol) {
    return protocol?.websiteUrl || "#";
  }

  const chainNames: Record<number, string> = {
    1: "ethereum",
    137: "polygon",
    42161: "arbitrum",
    56: "bsc",
  };

  let url = protocol.vaultUrlTemplate
    .replace("{vaultAddress}", vaultAddress.toLowerCase())
    .replace("{chainId}", chainId.toString())
    .replace("{chainName}", chainNames[chainId] || "ethereum");

  // For Aave, we need the asset address
  if (protocolId === "aave" && assetAddress) {
    url = url.replace("{assetAddress}", assetAddress.toLowerCase());
  }

  return url;
}

/**
 * Get protocol audit score for risk calculation
 */
export function getProtocolAuditScore(protocolId: string): number {
  return PROTOCOL_METADATA[protocolId]?.auditScore || 5; // Default to medium
}
