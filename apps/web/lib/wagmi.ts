import { createConfig } from "wagmi";
import { arbitrumSepolia, sepolia } from "wagmi/chains";
import { createPublicClient, defineChain, http } from "viem";
import { InjectedConnector } from "@wagmi/core/connectors/injected";
import { WalletConnectConnector } from "@wagmi/core/connectors/walletConnect";

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

const chains = [sepolia, polygonAmoy, arbitrumSepolia];

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

const getPublicClient = ({ chainId }: { chainId?: number }) => {
  const chain = chains.find((candidate) => candidate.id === chainId) ?? sepolia;
  return createPublicClient({
    chain,
    transport: http(chain.rpcUrls.default.http[0])
  });
};

export const wagmiConfig = createConfig({
  autoConnect: true,
  connectors,
  publicClient: getPublicClient
});

type ChainOption = {
  id: number;
  name: string;
  symbol: string;
};

export const supportedChains: ChainOption[] = chains.map((chain) => ({
  id: chain.id,
  name: chain.name,
  symbol: chain.nativeCurrency?.symbol ?? "ETH"
}));
