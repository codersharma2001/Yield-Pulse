import { createConfig } from "wagmi";
import { arbitrum, arbitrumSepolia, mainnet, polygon, sepolia } from "wagmi/chains";
import { createPublicClient, defineChain, http, type PublicClient } from "viem";
import { InjectedConnector } from "@wagmi/core/connectors/injected";
import { WalletConnectConnector } from "@wagmi/core/connectors/walletConnect";

import type { NetworkEnvironment } from "@/store/network-env";

const bsc = defineChain({
  id: 56,
  name: "BNB Smart Chain",
  network: "bsc",
  nativeCurrency: { name: "BNB", symbol: "BNB", decimals: 18 },
  rpcUrls: {
    default: {
      http: ["https://bsc-dataseed.binance.org"]
    },
    public: {
      http: ["https://bsc-dataseed.binance.org"]
    }
  },
  blockExplorers: {
    default: {
      name: "BscScan",
      url: "https://bscscan.com"
    }
  }
});

const bscTestnet = defineChain({
  id: 97,
  name: "BSC Testnet",
  network: "bsc-testnet",
  nativeCurrency: { name: "BNB", symbol: "BNB", decimals: 18 },
  rpcUrls: {
    default: {
      http: ["https://data-seed-prebsc-1-s1.binance.org:8545"]
    },
    public: {
      http: ["https://data-seed-prebsc-1-s1.binance.org:8545"]
    }
  },
  blockExplorers: {
    default: {
      name: "BscScan Testnet",
      url: "https://testnet.bscscan.com"
    }
  },
  testnet: true
});

const polygonAmoy = defineChain({
  id: 80_002,
  name: "Polygon Amoy",
  network: "polygon-amoy",
  nativeCurrency: { name: "MATIC", symbol: "MATIC", decimals: 18 },
  rpcUrls: {
    default: {
      http: ["https://rpc-amoy.polygon.technology"]
    },
    public: {
      http: ["https://rpc-amoy.polygon.technology"]
    }
  },
  blockExplorers: {
    default: {
      name: "Polygonscan",
      url: "https://www.oklink.com/amoy"
    }
  },
  testnet: true
});

export const CHAIN_SETS: Record<NetworkEnvironment, ReturnType<typeof defineChain>[]> = {
  testnet: [sepolia, polygonAmoy, arbitrumSepolia, bscTestnet],
  mainnet: [mainnet, polygon, arbitrum, bsc]
};

const chainMap = new Map<number, ReturnType<typeof defineChain>>();
for (const chain of [...CHAIN_SETS.testnet, ...CHAIN_SETS.mainnet]) {
  chainMap.set(chain.id, chain);
}

const chains = Array.from(chainMap.values());

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_ID;

const connectors: (InjectedConnector | WalletConnectConnector)[] = [
  new InjectedConnector({
    chains,
    options: {
      shimDisconnect: true
    }
  })
];

if (projectId) {
  connectors.push(
    new WalletConnectConnector({
      chains,
      options: {
        projectId,
        showQrModal: true,
        metadata: {
          name: "Yield Dashboard",
          description: "Cross-chain ERC-4626 vault dashboard",
          url: "https://yield-dashboard.example",
          icons: ["https://yield-dashboard.example/icon.png"]
        }
      }
    })
  );
}

const publicClients = chains.reduce<Record<number, PublicClient>>((acc, chain) => {
  const rpcUrl = chain.rpcUrls.default.http?.[0] ?? chain.rpcUrls.public?.http?.[0];
  acc[chain.id] = createPublicClient({
    chain,
    transport: http(rpcUrl)
  }) as PublicClient;
  return acc;
}, {});

const defaultClient = publicClients[chains[0].id]!;

const getPublicClient = (({ chainId }: { chainId?: number }) =>
  (publicClients[chainId ?? chains[0].id] ?? defaultClient)!) as (config: { chainId?: number }) => PublicClient;

export const wagmiConfig = createConfig({
  autoConnect: true,
  connectors,
  publicClient: getPublicClient as any
});

type ChainOption = {
  id: number;
  name: string;
  symbol: string;
};

export const getSupportedChains = (env: NetworkEnvironment): ChainOption[] =>
  CHAIN_SETS[env].map((chain) => ({
    id: chain.id,
    name: chain.name,
    symbol: chain.nativeCurrency?.symbol ?? "ETH"
  }));
