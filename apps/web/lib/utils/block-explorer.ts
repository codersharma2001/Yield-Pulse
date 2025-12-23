/**
 * Block explorer utilities for generating links to transactions and addresses
 */

// Block explorer base URLs by chain ID
const BLOCK_EXPLORERS: Record<number, { name: string; url: string }> = {
  // Mainnets
  1: { name: "Etherscan", url: "https://etherscan.io" },
  137: { name: "Polygonscan", url: "https://polygonscan.com" },
  42161: { name: "Arbiscan", url: "https://arbiscan.io" },
  56: { name: "BscScan", url: "https://bscscan.com" },

  // Testnets
  11155111: { name: "Sepolia Etherscan", url: "https://sepolia.etherscan.io" },
  80002: { name: "Polygon Amoy", url: "https://amoy.polygonscan.com" },
  421614: { name: "Arbitrum Sepolia", url: "https://sepolia.arbiscan.io" },
  97: { name: "BscScan Testnet", url: "https://testnet.bscscan.com" },
};

/**
 * Get block explorer info for a chain
 */
export function getBlockExplorer(chainId: number): { name: string; url: string } | null {
  return BLOCK_EXPLORERS[chainId] || null;
}

/**
 * Get transaction URL for a given chain and transaction hash
 */
export function getTransactionUrl(chainId: number, txHash: string): string | null {
  const explorer = getBlockExplorer(chainId);
  if (!explorer) {
    console.warn(`No block explorer configured for chain ID: ${chainId}`);
    return null;
  }
  return `${explorer.url}/tx/${txHash}`;
}

/**
 * Get address URL for a given chain and address
 */
export function getAddressUrl(chainId: number, address: string): string | null {
  const explorer = getBlockExplorer(chainId);
  if (!explorer) {
    console.warn(`No block explorer configured for chain ID: ${chainId}`);
    return null;
  }
  return `${explorer.url}/address/${address}`;
}

/**
 * Get token URL for a given chain and token address
 */
export function getTokenUrl(chainId: number, tokenAddress: string): string | null {
  const explorer = getBlockExplorer(chainId);
  if (!explorer) {
    console.warn(`No block explorer configured for chain ID: ${chainId}`);
    return null;
  }
  return `${explorer.url}/token/${tokenAddress}`;
}

/**
 * Format transaction hash for display (truncated)
 */
export function formatTxHash(txHash: string, startChars: number = 6, endChars: number = 4): string {
  if (!txHash) return "";
  if (txHash.length <= startChars + endChars) return txHash;
  return `${txHash.slice(0, startChars)}...${txHash.slice(-endChars)}`;
}
