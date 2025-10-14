import { PortfolioTable } from "@/components/portfolio/portfolio-table";

export default function PortfolioPage() {
  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <p className="text-sm uppercase tracking-wide text-slate-950/60">Portfolio</p>
        <h1 className="text-3xl font-semibold">Your cross-chain vault positions</h1>
        <p className="text-slate-950/70 dark:text-slate-200/70">
          Inspect unrealized PnL and allocations across vaults. Connect your wallet to load positions.
        </p>
      </header>
      <PortfolioTable />
    </section>
  );
}
