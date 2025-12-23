"use client";

import { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { AlertTriangle, CheckCircle, XCircle, Loader2, ExternalLink } from "lucide-react";
import type { SimulationResult } from "@yield-dashboard/sdk";
import type { TransactionState } from "@/lib/hooks/use-vault-transaction";
import { getTransactionUrl, formatTxHash } from "@/lib/utils/block-explorer";
import { Button } from "../ui/button";

interface TransactionConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  simulation: SimulationResult | null;
  vaultDetails: {
    name: string;
    asset: string;
    action: "deposit" | "withdraw";
    amount: string;
    chainId: number;
  };
  transactionState: TransactionState;
  onConfirm: () => void;
  onCancel: () => void;
}

export function TransactionConfirmationModal({
  isOpen,
  onClose,
  simulation,
  vaultDetails,
  transactionState,
  onConfirm,
  onCancel,
}: TransactionConfirmationModalProps) {
  const { status, error, txHash, approvalTxHash } = transactionState;

  const isProcessing =
    status === "approving" ||
    status === "approval-confirming" ||
    status === "executing" ||
    status === "confirming";

  const canConfirm = status === "idle" && simulation?.success;
  const canClose = status === "idle" || status === "success" || status === "error";

  const handleClose = () => {
    if (canClose) {
      onClose();
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-slate-900 p-6 text-left align-middle shadow-xl transition-all border border-slate-200 dark:border-slate-700">
                <Dialog.Title
                  as="h3"
                  className="text-lg font-semibold leading-6 text-slate-900 dark:text-white mb-4"
                >
                  {status === "idle" && "Confirm Transaction"}
                  {status === "approval-required" && "Approval Required"}
                  {status === "approving" && "Approving Token..."}
                  {status === "approval-confirming" && "Confirming Approval..."}
                  {status === "executing" && `${vaultDetails.action === "deposit" ? "Depositing" : "Withdrawing"}...`}
                  {status === "confirming" && "Confirming Transaction..."}
                  {status === "success" && "Transaction Successful!"}
                  {status === "error" && "Transaction Failed"}
                </Dialog.Title>

                <div className="space-y-4">
                  {/* Simulation Results */}
                  {status === "idle" && simulation && (
                    <>
                      <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4">
                        <div className="flex gap-3">
                          <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                          <div className="text-sm">
                            <p className="font-medium text-amber-900 dark:text-amber-300 mb-1">
                              Real Transaction Warning
                            </p>
                            <p className="text-amber-700 dark:text-amber-400">
                              This will execute a real blockchain transaction that cannot be reversed.
                              Make sure you understand what you're doing.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-600 dark:text-slate-400">Action:</span>
                          <span className="font-medium capitalize">{vaultDetails.action}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600 dark:text-slate-400">Vault:</span>
                          <span className="font-medium">{vaultDetails.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600 dark:text-slate-400">Amount:</span>
                          <span className="font-medium">
                            {vaultDetails.amount} {vaultDetails.asset}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600 dark:text-slate-400">Est. Gas:</span>
                          <span className="font-medium">{simulation.gasEstimate} wei</span>
                        </div>
                      </div>

                      {simulation.balanceChanges && simulation.balanceChanges.length > 0 && (
                        <div className="rounded-lg bg-slate-50 dark:bg-slate-800 p-3">
                          <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">
                            Expected Balance Changes:
                          </p>
                          {simulation.balanceChanges.map((change, idx) => (
                            <div key={idx} className="text-sm flex justify-between">
                              <span>{change.asset}:</span>
                              <span className="font-mono">{change.delta}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}

                  {/* Processing State */}
                  {isProcessing && (
                    <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4">
                      <div className="flex gap-3 items-center">
                        <Loader2 className="h-5 w-5 text-blue-600 dark:text-blue-400 animate-spin" />
                        <div className="text-sm">
                          {status === "approving" && (
                            <p className="text-blue-900 dark:text-blue-300">
                              Please confirm the approval in your wallet...
                            </p>
                          )}
                          {status === "approval-confirming" && (
                            <>
                              <p className="text-blue-900 dark:text-blue-300 mb-1">
                                Waiting for approval confirmation...
                              </p>
                              {approvalTxHash && (
                                <a
                                  href={getTransactionUrl(vaultDetails.chainId, approvalTxHash) || "#"}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                                >
                                  {formatTxHash(approvalTxHash)}
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              )}
                            </>
                          )}
                          {status === "executing" && (
                            <p className="text-blue-900 dark:text-blue-300">
                              Please confirm the transaction in your wallet...
                            </p>
                          )}
                          {status === "confirming" && (
                            <>
                              <p className="text-blue-900 dark:text-blue-300 mb-1">
                                Transaction submitted! Waiting for confirmation...
                              </p>
                              {txHash && (
                                <a
                                  href={getTransactionUrl(vaultDetails.chainId, txHash) || "#"}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                                >
                                  {formatTxHash(txHash)}
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Success State */}
                  {status === "success" && (
                    <div className="rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-4">
                      <div className="flex gap-3">
                        <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                        <div className="text-sm">
                          <p className="font-medium text-green-900 dark:text-green-300 mb-2">
                            Transaction confirmed!
                          </p>
                          {txHash && (
                            <a
                              href={getTransactionUrl(vaultDetails.chainId, txHash) || "#"}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-green-600 dark:text-green-400 hover:underline flex items-center gap-1"
                            >
                              View on Block Explorer
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Error State */}
                  {status === "error" && (
                    <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4">
                      <div className="flex gap-3">
                        <XCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                        <div className="text-sm">
                          <p className="font-medium text-red-900 dark:text-red-300 mb-1">
                            Transaction failed
                          </p>
                          <p className="text-red-700 dark:text-red-400">
                            {error || "An unknown error occurred"}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="mt-6 flex gap-3">
                  {status === "idle" && (
                    <>
                      <Button
                        variant="secondary"
                        onClick={onCancel}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="primary"
                        onClick={onConfirm}
                        disabled={!canConfirm}
                        className="flex-1"
                      >
                        Execute Transaction
                      </Button>
                    </>
                  )}

                  {(status === "success" || status === "error") && (
                    <Button
                      variant="primary"
                      onClick={handleClose}
                      className="flex-1"
                    >
                      Close
                    </Button>
                  )}

                  {isProcessing && (
                    <div className="flex-1 text-center text-sm text-slate-600 dark:text-slate-400">
                      Please wait...
                    </div>
                  )}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
