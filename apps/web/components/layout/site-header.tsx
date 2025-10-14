"use client";

import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";
import { Beaker, ExternalLink } from "lucide-react";

import { ActivityToggle } from "@/components/activity/activity-toggle";
import { ChainSelector } from "@/components/shared/chain-selector";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { WalletConnectButton } from "@/components/wallet/wallet-connect-button";
import { cn } from "@/lib/utils";

const navLinks: { href: Route; label: string }[] = [
  { href: "/", label: "Explore" },
  { href: "/portfolio", label: "Portfolio" },
  { href: "/operator", label: "Operator" }
];

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-gradient-to-br from-white/95 via-white/90 to-white/30 backdrop-blur">
      <div className="container flex h-20 items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
              <Beaker className="h-5 w-5" />
            </span>
            <div className="flex flex-col leading-tight">
              <span className="text-base font-semibold tracking-tight">Cross-Chain Yield Vaults</span>
              <span className="text-xs text-slate-950/60 dark:text-slate-200/70">Demo / Education only</span>
            </div>
          </Link>
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm font-medium text-slate-950/70 transition hover:bg-slate-950/5",
                  pathname === link.href ? "bg-slate-950/5 text-foreground" : ""
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="warning" className="hidden sm:inline-flex">
            Testnet
          </Badge>
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
