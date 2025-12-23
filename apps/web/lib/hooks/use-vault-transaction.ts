"use client";

import { useState, useEffect } from "react";
import { useAccount, useContractRead, useContractWrite, useWaitForTransaction } from "wagmi";
import { parseUnits, type Address } from "viem";
import { ERC20_ABI } from "../abis/erc20";
import { ERC4626_ABI } from "../abis/erc4626";

export type TransactionStatus =
  | "idle"
  | "checking-allowance"
  | "approval-required"
  | "approving"
  | "approval-confirming"
  | "executing"
  | "confirming"
  | "success"
  | "error";

export interface TransactionState {
  status: TransactionStatus;
  error?: string;
  txHash?: `0x${string}`;
  approvalTxHash?: `0x${string}`;
}

/**
 * Hook to check and manage token approval
 */
export function useTokenApproval(
  tokenAddress: Address | undefined,
  spenderAddress: Address | undefined,
  requiredAmount: bigint | undefined
) {
  const { address: userAddress } = useAccount();

  // Read current allowance
  const {
    data: allowance,
    refetch: refetchAllowance,
    isLoading: isLoadingAllowance,
  } = useContractRead({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: "allowance",
    args: userAddress && spenderAddress ? [userAddress, spenderAddress] : undefined,
    enabled: Boolean(userAddress && tokenAddress && spenderAddress),
  });

  // Write: Approve
  const {
    write: approveWrite,
    data: approveData,
    isLoading: isApproving,
    error: approveError,
  } = useContractWrite({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: "approve",
  });

  // Wait for approval transaction
  const {
    isLoading: isApprovePending,
    isSuccess: isApproveSuccess,
  } = useWaitForTransaction({
    hash: approveData?.hash,
    enabled: Boolean(approveData?.hash),
    onSuccess: () => {
      // Refetch allowance after approval
      refetchAllowance();
    },
  });

  const needsApproval =
    requiredAmount &&
    allowance !== undefined &&
    BigInt(allowance) < requiredAmount;

  const approve = (amount: bigint) => {
    if (!spenderAddress) {
      throw new Error("Spender address is required");
    }
    approveWrite({
      args: [spenderAddress, amount],
    });
  };

  return {
    allowance: allowance ? BigInt(allowance) : BigInt(0),
    needsApproval,
    approve,
    isApproving: isApproving || isApprovePending,
    isApproveSuccess,
    approveError,
    approveTxHash: approveData?.hash,
    refetchAllowance,
  };
}

/**
 * Hook to execute vault deposit with automatic approval handling
 */
export function useVaultDeposit(
  vaultAddress: Address | undefined,
  assetAddress: Address | undefined
) {
  const { address: userAddress } = useAccount();
  const [state, setState] = useState<TransactionState>({ status: "idle" });

  // Token approval hook
  const [depositAmount, setDepositAmount] = useState<bigint | undefined>();
  const {
    needsApproval,
    approve,
    isApproving,
    isApproveSuccess,
    approveError,
    approveTxHash,
  } = useTokenApproval(assetAddress, vaultAddress, depositAmount);

  // Write: Deposit
  const {
    write: depositWrite,
    data: depositData,
    isLoading: isDepositing,
    error: depositError,
  } = useContractWrite({
    address: vaultAddress,
    abi: ERC4626_ABI,
    functionName: "deposit",
  });

  // Wait for deposit transaction
  const {
    isLoading: isDepositPending,
    isSuccess: isDepositSuccess,
  } = useWaitForTransaction({
    hash: depositData?.hash,
    enabled: Boolean(depositData?.hash),
  });

  // Update state based on approval status
  useEffect(() => {
    if (isApproving) {
      setState({ status: "approving", approvalTxHash: approveTxHash });
    } else if (isApproveSuccess && state.status === "approving") {
      setState({ status: "approval-confirming", approvalTxHash: approveTxHash });
    }
  }, [isApproving, isApproveSuccess, approveTxHash, state.status]);

  // Update state based on deposit status
  useEffect(() => {
    if (isDepositing || isDepositPending) {
      setState((prev) => ({
        ...prev,
        status: isDepositing ? "executing" : "confirming",
        txHash: depositData?.hash,
      }));
    } else if (isDepositSuccess) {
      setState((prev) => ({
        ...prev,
        status: "success",
        txHash: depositData?.hash,
      }));
    }
  }, [isDepositing, isDepositPending, isDepositSuccess, depositData?.hash]);

  // Handle errors
  useEffect(() => {
    if (approveError) {
      setState({
        status: "error",
        error: approveError.message || "Approval failed",
      });
    } else if (depositError) {
      setState({
        status: "error",
        error: depositError.message || "Deposit failed",
      });
    }
  }, [approveError, depositError]);

  const deposit = async (amountInUnits: string, decimals: number = 18) => {
    if (!userAddress || !vaultAddress) {
      setState({ status: "error", error: "Wallet not connected" });
      return;
    }

    try {
      const amount = parseUnits(amountInUnits, decimals);
      setDepositAmount(amount);

      // Check if approval is needed
      if (needsApproval) {
        setState({ status: "approval-required" });
        // Approve max uint256 to avoid future approvals
        approve(BigInt("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"));
        return;
      }

      // Execute deposit
      setState({ status: "executing" });
      depositWrite({
        args: [amount, userAddress],
      });
    } catch (error) {
      setState({
        status: "error",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  // Auto-execute deposit after approval
  useEffect(() => {
    if (isApproveSuccess && depositAmount && !isDepositing && !isDepositSuccess) {
      depositWrite({
        args: [depositAmount, userAddress!],
      });
    }
  }, [isApproveSuccess, depositAmount, userAddress, isDepositing, isDepositSuccess, depositWrite]);

  const reset = () => {
    setState({ status: "idle" });
    setDepositAmount(undefined);
  };

  return {
    deposit,
    reset,
    state,
    needsApproval,
  };
}

/**
 * Hook to execute vault withdraw
 */
export function useVaultWithdraw(vaultAddress: Address | undefined) {
  const { address: userAddress } = useAccount();
  const [state, setState] = useState<TransactionState>({ status: "idle" });

  // Write: Withdraw
  const {
    write: withdrawWrite,
    data: withdrawData,
    isLoading: isWithdrawing,
    error: withdrawError,
  } = useContractWrite({
    address: vaultAddress,
    abi: ERC4626_ABI,
    functionName: "withdraw",
  });

  // Wait for withdraw transaction
  const {
    isLoading: isWithdrawPending,
    isSuccess: isWithdrawSuccess,
  } = useWaitForTransaction({
    hash: withdrawData?.hash,
    enabled: Boolean(withdrawData?.hash),
  });

  // Update state
  useEffect(() => {
    if (isWithdrawing || isWithdrawPending) {
      setState({
        status: isWithdrawing ? "executing" : "confirming",
        txHash: withdrawData?.hash,
      });
    } else if (isWithdrawSuccess) {
      setState({
        status: "success",
        txHash: withdrawData?.hash,
      });
    }
  }, [isWithdrawing, isWithdrawPending, isWithdrawSuccess, withdrawData?.hash]);

  // Handle errors
  useEffect(() => {
    if (withdrawError) {
      setState({
        status: "error",
        error: withdrawError.message || "Withdraw failed",
      });
    }
  }, [withdrawError]);

  const withdraw = (amountInUnits: string, decimals: number = 18) => {
    if (!userAddress || !vaultAddress) {
      setState({ status: "error", error: "Wallet not connected" });
      return;
    }

    try {
      const amount = parseUnits(amountInUnits, decimals);
      setState({ status: "executing" });
      withdrawWrite({
        args: [amount, userAddress, userAddress],
      });
    } catch (error) {
      setState({
        status: "error",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  const reset = () => {
    setState({ status: "idle" });
  };

  return {
    withdraw,
    reset,
    state,
  };
}
