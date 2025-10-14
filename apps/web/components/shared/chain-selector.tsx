"use client";

import { Fragment, useMemo } from "react";
import { Listbox, Transition } from "@headlessui/react";
import { Check, ChevronDown } from "lucide-react";
import { useChainId, useSwitchNetwork } from "wagmi";

import { Button } from "@/components/ui/button";
import { supportedChains } from "@/lib/wagmi";
import { cn } from "@/lib/utils";

export function ChainSelector() {
  const activeChainId = useChainId();
  const { switchNetwork, error, isLoading, pendingChainId, chains } = useSwitchNetwork({
    chainId: activeChainId
  });

  const fallbackChains = useMemo(
    () =>
      supportedChains.map((chain) => ({
        id: chain.id,
        name: chain.name,
        nativeCurrency: { symbol: chain.symbol }
      })),
    []
  );

  const availableChains = chains.length ? chains : fallbackChains;
  const selected = useMemo(
    () => availableChains.find((chain) => chain.id === activeChainId) ?? availableChains[0],
    [availableChains, activeChainId]
  );

  const handleChange = (chainId: number) => {
    if (!switchNetwork || chainId === activeChainId) return;
    switchNetwork(chainId);
  };

  return (
    <div className="relative">
      <Listbox value={selected?.id} onChange={handleChange} disabled={!switchNetwork}>
        <div>
          <Listbox.Button as={Button} variant="ghost" size="sm" className="gap-2">
            <span className="h-2 w-2 rounded-full bg-accent" aria-hidden />
            <span className="text-sm font-medium">
              {selected?.name ?? "Select chain"}
              {isLoading && pendingChainId ? " •" : ""}
            </span>
            <ChevronDown className="h-4 w-4 opacity-60" />
          </Listbox.Button>
        </div>
        <Transition
          as={Fragment}
          enter="transition ease-out duration-100"
          enterFrom="transform scale-95 opacity-0"
          enterTo="transform scale-100 opacity-100"
          leave="transition ease-in duration-75"
          leaveFrom="transform scale-100 opacity-100"
          leaveTo="transform scale-95 opacity-0"
        >
          <Listbox.Options className="absolute right-0 mt-2 w-56 origin-top-right rounded-xl border border-border bg-card p-2 text-sm shadow-md focus:outline-none">
            {availableChains.map((chain) => (
              <Listbox.Option
                key={chain.id}
                value={chain.id}
                className={({ active }) =>
                  cn(
                    "flex cursor-pointer items-center justify-between rounded-lg px-3 py-2",
                    active ? "bg-slate-950/5" : ""
                  )
                }
              >
                {({ selected: optionSelected }) => (
                  <>
                    <div>
                      <p className="font-medium">{chain.name}</p>
                      <p className="text-xs text-slate-950/60 dark:text-slate-200/70">{chain.nativeCurrency.symbol}</p>
                    </div>
                    {optionSelected ? <Check className="h-4 w-4 text-accent" /> : null}
                  </>
                )}
              </Listbox.Option>
            ))}
          </Listbox.Options>
        </Transition>
      </Listbox>
      {error ? <p className="mt-1 text-xs text-danger">{error.message}</p> : null}
    </div>
  );
}
