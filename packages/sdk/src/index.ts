export interface VaultMetadata {
  id: string;
  chainId: number;
  asset: string;
  protocolId: string;
  name: string;
}

export const createVaultId = (chainId: number, address: string) => `${chainId}:${address.toLowerCase()}`;

export const VERSION = "0.1.0";
