import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const roadmap = [
  {
    title: "Live Yields",
    description: "Aave, Curve, and Pendle vaults normalized into a unified APY surface with risk flags.",
    status: "In progress"
  },
  {
    title: "Tenderly Simulations",
    description: "Pre-flight deposit and withdraw transactions with gas, slippage, and balance deltas.",
    status: "Planned"
  },
  {
    title: "Portfolio Tracking",
    description: "Cross-chain position visibility and quick withdraw flows with share previews.",
    status: "Queued"
  }
];

export default function Home() {
  return (
    <div className="flex flex-col gap-12">
      <section className="grid gap-6 rounded-3xl border border-border/70 bg-white/90 p-10 shadow-md dark:bg-slate-950/70">
        <Badge variant="accent" className="w-fit">Multi-chain testnets</Badge>
        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,320px)] md:items-center">
          <div className="space-y-4">
            <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
              Navigate cross-chain ERC-4626 yield vaults with confidence.
            </h1>
            <p className="text-lg text-slate-950/70 dark:text-slate-200/70">
              Discover opportunities, simulate actions with Tenderly, and execute deposits or withdrawals across LayerZero-enabled vaults — all from a single control center.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/vault/demo-vault">View demo vault</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="https://github.com" target="_blank" rel="noreferrer">
                  Implementation playbook
                </Link>
              </Button>
            </div>
          </div>
          <div className="grid gap-3 rounded-2xl border border-dashed border-border/80 bg-slate-950/5 p-6 text-sm text-slate-950/80 dark:bg-white/5 dark:text-slate-200/80">
            <div className="flex items-center justify-between">
              <span>Latest block indexed</span>
              <span className="font-medium">#18,234,550</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Vaults tracked</span>
              <span className="font-medium">12 (Aave v3)</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Next milestones</span>
              <span className="font-medium text-accent">Curve + Pendle</span>
            </div>
            <p className="text-xs text-slate-950/60 dark:text-slate-200/70">
              Data shown is seeded for demo purposes while the indexer wiring lands.
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        {roadmap.map((item) => (
          <Card key={item.title} className="h-full bg-white/90 dark:bg-slate-950/70">
            <CardHeader>
              <CardTitle>{item.title}</CardTitle>
              <CardDescription>{item.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Badge variant="secondary" className="w-fit">
                {item.status}
              </Badge>
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  );
}
