"use client";

import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";
import { Beaker, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";

import { ActivityToggle } from "@/components/activity/activity-toggle";
import { ChainSelector } from "@/components/shared/chain-selector";
import { NetworkToggle } from "@/components/shared/network-toggle";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { Button } from "@/components/ui/button";
import { WalletConnectButton } from "@/components/wallet/wallet-connect-button";
import { cn } from "@/lib/utils";
import { NetworkStatusBadge } from "@/components/shared/network-status-badge";

const navLinks: { href: Route; label: string }[] = [
  { href: "/", label: "Explore" },
  { href: "/portfolio", label: "Portfolio" },
  { href: "/operator", label: "Operator" }
];

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-gradient-to-br from-white/95 via-white/90 to-white/30 backdrop-blur dark:from-slate-950/90 dark:via-slate-950/80 dark:to-slate-900/70">
      <div className="container flex h-20 items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <Link href="/" className="group flex items-center gap-3">
            <motion.span
              initial={{ rotate: -10, scale: 0.9, opacity: 0 }}
              animate={{ rotate: 0, scale: 1, opacity: 1 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 via-emerald-400 to-blue-600 text-white shadow-lg shadow-sky-500/40"
            >
              <Beaker className="h-5 w-5" />
            </motion.span>
            <motion.div
              initial={{ y: 8, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.45, ease: "easeOut", delay: 0.1 }}
              className="flex flex-col leading-tight"
            >
              <span className="bg-gradient-to-r from-slate-900 via-sky-700 to-emerald-600 bg-clip-text text-lg font-semibold tracking-tight text-transparent dark:from-white dark:via-sky-200 dark:to-emerald-200">
                YieldPulse
              </span>
              <span className="text-xs text-slate-950/60 transition-colors group-hover:text-slate-950/80 dark:text-slate-200/70 dark:group-hover:text-slate-100">
                Cross-chain yield intelligence
              </span>
            </motion.div>
          </Link>
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-xl px-3 py-2 text-sm font-medium text-slate-950/70 transition-all hover:bg-slate-950/5 hover:text-slate-950/90 dark:text-slate-200/70 dark:hover:bg-white/10 dark:hover:text-white/90",
                  pathname === link.href
                    ? "bg-slate-950/5 text-foreground shadow-sm ring-1 ring-slate-200/80 dark:bg-white/10 dark:text-foreground dark:ring-white/20"
                    : ""
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden sm:inline-flex">
            <NetworkStatusBadge />
          </div>
          <NetworkToggle />
          <ActivityToggle />
          <ChainSelector />
          <ThemeToggle />
          <WalletConnectButton />
          <Button
            asChild
            variant="ghost"
            size="icon"
            className="hidden sm:inline-flex"
            aria-label="Open documentation"
          >
            <Link href="https://docs.example.com" target="_blank" rel="noreferrer">
              <ExternalLink className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
