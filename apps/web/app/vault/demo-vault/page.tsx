const mockVault = {
  name: "USDC Aave v3 – Arbitrum (Demo)",
  protocol: "Aave",
  chain: "Arbitrum Sepolia",
  apy: "3.42%",
  tvl: "$1.2M",
  description:
    "Demo-only vault showcasing the upcoming experience. Real metrics, charts, and on-chain controls will appear as the backend and contract integrations land."
};

export default function DemoVaultPage() {
  return (
    <section className="space-y-8">
      <header className="rounded-3xl border border-border bg-white/90 p-8 dark:bg-slate-950/70">
        <p className="text-sm uppercase tracking-wide text-slate-950/60">Preview</p>
        <h1 className="mt-2 text-3xl font-semibold">{mockVault.name}</h1>
        <p className="mt-4 text-slate-950/70 dark:text-slate-200/70">{mockVault.description}</p>
        <dl className="mt-6 grid gap-4 text-sm md:grid-cols-4">
          <div>
            <dt className="text-slate-950/60 dark:text-slate-200/60">Protocol</dt>
            <dd className="font-semibold text-foreground">{mockVault.protocol}</dd>
          </div>
          <div>
            <dt className="text-slate-950/60 dark:text-slate-200/60">Chain</dt>
            <dd className="font-semibold text-foreground">{mockVault.chain}</dd>
          </div>
          <div>
            <dt className="text-slate-950/60 dark:text-slate-200/60">APY (demo)</dt>
            <dd className="font-semibold text-accent">{mockVault.apy}</dd>
          </div>
          <div>
            <dt className="text-slate-950/60 dark:text-slate-200/60">TVL (demo)</dt>
            <dd className="font-semibold text-foreground">{mockVault.tvl}</dd>
          </div>
        </dl>
      </header>
      <div className="rounded-3xl border border-dashed border-border p-8 text-sm text-slate-950/70 dark:text-slate-200/70">
        The full vault experience will include charts, position breakdowns, Tenderly simulations, and transaction flows. For
        now, this static preview keeps the navigation path available while backend work completes.
      </div>
    </section>
  );
}
