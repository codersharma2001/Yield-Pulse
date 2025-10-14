export default function PortfolioPage() {
  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <p className="text-sm uppercase tracking-wide text-slate-950/60">Portfolio</p>
        <h1 className="text-3xl font-semibold">Your cross-chain vault positions</h1>
        <p className="text-slate-950/70 dark:text-slate-200/70">
          Portfolio analytics will arrive shortly. You&apos;ll be able to inspect unrealized PnL, allocations, and trigger
          rapid withdrawals across chains from this page.
        </p>
      </header>
      <div className="rounded-3xl border border-dashed border-border p-8 text-sm text-slate-950/60 dark:text-slate-200/70">
        No positions found. Connect a wallet and deposit into a vault to see your holdings.
      </div>
    </section>
  );
}
