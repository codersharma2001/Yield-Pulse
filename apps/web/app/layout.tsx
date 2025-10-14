import type { Metadata } from "next";
import "./globals.css";

import { ActivityDrawer } from "@/components/activity/activity-drawer";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { Providers } from "@/app/providers";

export const metadata: Metadata = {
  title: "Yield Dashboard",
  description: "Cross-chain ERC-4626 vault explorer and controller"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
        <Providers>
          <div className="relative flex min-h-screen flex-col">
            <SiteHeader />
            <main className="flex-1 bg-gradient-to-br from-white/70 via-white to-blue-50/40 py-10 dark:from-slate-950/80 dark:via-slate-950 dark:to-slate-900/90">
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
