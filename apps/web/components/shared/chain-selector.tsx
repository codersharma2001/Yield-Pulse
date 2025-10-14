"use client";

import { Fragment, useMemo } from "react";
import { Listbox, Transition } from "@headlessui/react";
import { Check, ChevronDown } from "lucide-react";
import { useChainId, useSwitchNetwork } from "wagmi";

import { Button } from "@/components/ui/button";
import { getSupportedChains } from "@/lib/wagmi";
import { cn } from "@/lib/utils";
import { useNetworkEnv } from "@/store/network-env";

type DisplayChain = {
  id: number;
  name: string;
  symbol: string;
};

export function ChainSelector() {
  const activeChainId = useChainId();
  const env = useNetworkEnv((state) => state.env);
  const { switchNetwork, error, isLoading, pendingChainId, chains } = useSwitchNetwork({
    chainId: activeChainId
  });

  const supported = useMemo(() => getSupportedChains(env), [env]);
  const allowedIds = useMemo(() => new Set(supported.map((chain) => chain.id)), [supported]);

  const fallbackChains = useMemo<DisplayChain[]>(
    () => supported.map((chain) => ({ id: chain.id, name: chain.name, symbol: chain.symbol })),
    [supported]
  );

  const availableChains = useMemo<DisplayChain[]>(() => {
    const source = chains.length ? chains : fallbackChains;
    return source
      .filter((chain) => allowedIds.has(chain.id))
      .map((chain) => ({
        id: chain.id,
        name: chain.name,
        symbol:
          "nativeCurrency" in chain && chain.nativeCurrency?.symbol
            ? chain.nativeCurrency.symbol
            : supported.find((item) => item.id === chain.id)?.symbol ?? "ETH"
      }));
  }, [chains, fallbackChains, allowedIds, supported]);

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
          <Listbox.Options className="absolute right-0 mt-2 w-56 origin-top-right rounded-2xl border border-border/80 bg-white/95 p-2 text-sm text-slate-900 shadow-xl shadow-sky-500/10 backdrop-blur focus:outline-none dark:border-white/10 dark:bg-slate-900/95 dark:text-slate-100">
            {availableChains.map((chain) => (
              <Listbox.Option
                key={chain.id}
                value={chain.id}
                className={({ active }) =>
                  cn(
                    "flex cursor-pointer items-center justify-between rounded-xl px-3 py-2 transition-colors",
                    active ? "bg-slate-950/5 dark:bg-white/10" : ""
                  )
                }
              >
                {({ selected: optionSelected }) => (
                  <>
                    <div>
                      <p className="font-medium text-slate-950 dark:text-white">{chain.name}</p>
                      <p className="text-xs text-slate-950/60 dark:text-slate-300/75">{chain.symbol}</p>
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
