import type { Metadata } from "next";
import "./globals.css";

import { ActivityDrawer } from "@/components/activity/activity-drawer";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { Providers } from "@/app/providers";

export const metadata: Metadata = {
  title: "YieldPulse",
  description: "YieldPulse – cross-chain ERC-4626 yield intelligence and execution dashboard"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
        <Providers>
          <div className="relative flex min-h-screen flex-col">
            <SiteHeader />
            <main className="relative flex-1 overflow-hidden bg-gradient-to-br from-white/70 via-white to-sky-50/60 py-10 dark:from-slate-950/85 dark:via-slate-950 dark:to-slate-900/90">
              <div className="pointer-events-none absolute inset-0 -z-10 opacity-60 blur-3xl">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(79,70,229,0.22),transparent_55%)] dark:bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.32),transparent_60%)]" />
              </div>
              <div className="container">{children}</div>
            </main>
            <SiteFooter />
          </div>
          <ActivityDrawer />
        </Providers>
      </body>
    </html>
  );
}
