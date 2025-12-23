import { encodeFunctionData } from "viem";

// ERC4626 Vault ABI (minimal - just what we need)
const VAULT_ABI = [
  {
    name: "deposit",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "assets", type: "uint256" },
      { name: "receiver", type: "address" }
    ],
    outputs: [{ name: "shares", type: "uint256" }]
  },
  {
    name: "withdraw",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "assets", type: "uint256" },
      { name: "receiver", type: "address" },
      { name: "owner", type: "address" }
    ],
    outputs: [{ name: "shares", type: "uint256" }]
  }
] as const;

export function encodeDepositCall(assets: bigint, receiver: `0x${string}`): `0x${string}` {
  return encodeFunctionData({
    abi: VAULT_ABI,
    functionName: "deposit",
    args: [assets, receiver]
  });
}

export function encodeWithdrawCall(
  assets: bigint,
  receiver: `0x${string}`,
  owner: `0x${string}`
): `0x${string}` {
  return encodeFunctionData({
    abi: VAULT_ABI,
    functionName: "withdraw",
    args: [assets, receiver, owner]
  });
}
