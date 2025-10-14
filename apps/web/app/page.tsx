"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

import { VaultExplorer } from "@/components/vaults/vault-explorer";
import { NetworkStatusBadge } from "@/components/shared/network-status-badge";
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

const heroVariants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0 }
};

export default function Home() {
  return (
    <div className="flex flex-col gap-14 pb-4">
      <motion.section
        initial="hidden"
        animate="show"
        variants={heroVariants}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative overflow-hidden rounded-3xl border border-border/60 bg-white/95 p-10 shadow-xl shadow-sky-500/5 ring-1 ring-sky-100/40 dark:border-slate-800/80 dark:bg-slate-950/70 dark:ring-white/5"
      >
        <div className="pointer-events-none absolute -top-32 right-0 h-64 w-64 rounded-full bg-gradient-to-br from-sky-400/30 via-emerald-300/20 to-transparent blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-16 h-48 w-48 rounded-full bg-gradient-to-tr from-indigo-400/20 via-sky-300/20 to-transparent blur-3xl" />
        <div className="flex flex-wrap items-center justify-between gap-6">
          <NetworkStatusBadge />
          <Badge variant="outline" className="flex items-center gap-2 border-sky-500/30 bg-sky-500/10 text-sky-700 dark:border-sky-400/40 dark:bg-sky-400/10 dark:text-sky-200">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            Live demo environment
          </Badge>
        </div>
        <div className="mt-8 grid gap-8 md:grid-cols-[minmax(0,1fr)_minmax(0,320px)] md:items-center">
          <div className="space-y-5">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.05 }}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200/70 bg-slate-50/70 px-4 py-1 text-xs font-medium uppercase tracking-[0.2em] text-slate-600 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-slate-200"
            >
              YieldPulse
              <span className="rounded-full bg-emerald-400/20 px-2 py-[1px] text-[0.65rem] text-emerald-600 dark:bg-emerald-400/15 dark:text-emerald-200">
                New Drop
              </span>
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.1 }}
              className="text-4xl font-semibold tracking-tight md:text-5xl"
            >
              Decode every ERC-4626 yield vault signal in one command center.
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="text-lg text-slate-950/70 dark:text-slate-200/75"
            >
              YieldPulse fuses vault analytics, Tenderly-powered simulations, and wallet-native execution so you can scout, stress-test, and act across Aave, Curve, and Pendle strategies without
              leaving the dashboard.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex flex-wrap gap-3"
            >
              <Button asChild size="lg" className="group">
                <Link href="/vault/demo-vault">
                  Dive into YieldPulse
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="https://github.com" target="_blank" rel="noreferrer">
                  Implementation playbook
                </Link>
              </Button>
            </motion.div>
          </div>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.55, delay: 0.18, ease: "easeOut" }}
            className="grid gap-4 rounded-2xl border border-slate-200/80 bg-gradient-to-br from-white/80 via-sky-50/60 to-emerald-50/50 p-6 text-sm text-slate-950/85 shadow-xl dark:border-white/10 dark:from-slate-950/60 dark:via-slate-900/60 dark:to-slate-900/40 dark:text-slate-200/80"
          >
            <div className="flex items-center justify-between text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Telemetry Snapshot
              <span className="rounded-full bg-slate-950/5 px-2 py-0.5 font-medium text-slate-700 dark:bg-white/10 dark:text-white/80">Live</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Latest block indexed</span>
              <span className="font-semibold text-slate-900 dark:text-white">#18,234,550</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Vaults tracked</span>
              <span className="font-semibold text-slate-900 dark:text-white">12 · Aave v3</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Next integrations</span>
              <span className="font-semibold text-sky-600 dark:text-sky-300">Curve · Pendle</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300/80">
              Data is pre-seeded for the demo while the indexer connection ships.
            </p>
          </motion.div>
        </div>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.55, ease: "easeOut" }}
      >
        <VaultExplorer />
      </motion.section>

      <section className="grid gap-6 md:grid-cols-3">
        {roadmap.map((item, index) => (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.45, delay: index * 0.08 }}
            whileHover={{ y: -6, scale: 1.01 }}
            className="h-full"
          >
            <Card className="h-full border border-border/60 bg-white/90 shadow-lg shadow-sky-500/5 transition-colors dark:border-white/10 dark:bg-slate-950/65">
              <CardHeader>
                <CardTitle className="text-lg">{item.title}</CardTitle>
                <CardDescription>{item.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Badge variant="secondary" className="w-fit bg-sky-500/15 text-sky-700 dark:bg-sky-500/20 dark:text-sky-200">
                  {item.status}
                </Badge>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </section>
    </div>
  );
}
