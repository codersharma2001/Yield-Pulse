"use client";

import { Fragment, useEffect, useState } from "react";
import { Menu, Transition } from "@headlessui/react";
import { Copy, LogOut, PlugZap } from "lucide-react";
import { useAccount, useConnect, useDisconnect } from "wagmi";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function WalletConnectButton() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const { address, isConnecting } = useAccount();
  const { connect, connectors, isLoading: isConnectingConnector, pendingConnector } = useConnect();
  const { disconnect } = useDisconnect();

  if (!mounted) {
    return (
      <Button variant="primary" size="sm" className="gap-2" disabled>
        <PlugZap className="h-4 w-4" />
        Connect Wallet
      </Button>
    );
  }

  if (address) {
    const label = `${address.slice(0, 6)}…${address.slice(-4)}`;
    return (
      <Menu as="div" className="relative">
        <Menu.Button as={Button} variant="secondary" size="sm" className="gap-2">
          <PlugZap className="h-4 w-4" />
          {label}
        </Menu.Button>
        <Transition
          as={Fragment}
          enter="transition ease-out duration-100"
          enterFrom="transform scale-95 opacity-0"
          enterTo="transform scale-100 opacity-100"
          leave="transition ease-in duration-75"
          leaveFrom="transform scale-100 opacity-100"
          leaveTo="transform scale-95 opacity-0"
        >
          <Menu.Items className="absolute right-0 mt-2 w-48 origin-top-right rounded-xl border border-border bg-card p-2 shadow-md focus:outline-none">
            <Menu.Item>
              {({ active }) => (
                <button
                  type="button"
                  className={cn(
                    "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm",
                    active ? "bg-slate-950/5" : ""
                  )}
                  onClick={() => navigator.clipboard?.writeText(address)}
                >
                  <Copy className="h-4 w-4 opacity-70" />
                  Copy address
                </button>
              )}
            </Menu.Item>
            <Menu.Item>
              {({ active }) => (
                <button
                  type="button"
                  className={cn(
                    "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-danger",
                    active ? "bg-danger/10" : ""
                  )}
                  onClick={() => disconnect()}
                >
                  <LogOut className="h-4 w-4" />
                  Disconnect
                </button>
              )}
            </Menu.Item>
          </Menu.Items>
        </Transition>
      </Menu>
    );
  }

  return (
    <Menu as="div" className="relative">
      <Menu.Button as={Button} variant="primary" size="sm" className="gap-2" disabled={isConnecting}>
        <PlugZap className="h-4 w-4" />
        {isConnecting ? "Connecting…" : "Connect Wallet"}
      </Menu.Button>
      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform scale-95 opacity-0"
        enterTo="transform scale-100 opacity-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform scale-100 opacity-100"
        leaveTo="transform scale-95 opacity-0"
      >
        <Menu.Items className="absolute right-0 mt-2 w-56 origin-top-right rounded-xl border border-border bg-card p-2 shadow-md focus:outline-none">
          <p className="px-3 pb-1 text-xs uppercase tracking-wide text-slate-950/60">Available wallets</p>
          {connectors.map((connector) => (
            <Menu.Item key={connector.id}>
              {({ active }) => (
                <button
                  type="button"
                  className={cn(
                    "flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm",
                    active ? "bg-slate-950/5" : ""
                  )}
                  onClick={() => connect({ connector })}
                  disabled={!connector.ready}
                >
                  <span>{connector.name}</span>
                  {!connector.ready ? (
                    <span className="text-xs uppercase text-warning">Unsupported</span>
                  ) : isConnectingConnector && connector.id === pendingConnector?.id ? (
                    <span className="text-xs text-accent">Connecting…</span>
                  ) : null}
                </button>
              )}
            </Menu.Item>
          ))}
        </Menu.Items>
      </Transition>
    </Menu>
  );
}
