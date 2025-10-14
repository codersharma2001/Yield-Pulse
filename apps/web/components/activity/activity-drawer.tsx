"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Clock, X } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useActivityStore } from "@/store/activity-store";

const STATUS_COLOR: Record<string, string> = {
  pending: "text-warning",
  confirmed: "text-success",
  failed: "text-danger"
};

export function ActivityDrawer() {
  const { isOpen, entries, close } = useActivityStore();

  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.aside
          initial={{ x: 320 }}
          animate={{ x: 0 }}
          exit={{ x: 320 }}
          transition={{ type: "spring", stiffness: 260, damping: 25 }}
          className="fixed inset-y-0 right-0 z-50 flex w-full max-w-sm flex-col border-l border-border bg-card p-6 shadow-lg"
          role="complementary"
          aria-label="Activity drawer"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Recent activity</h2>
              <p className="text-sm text-slate-950/60 dark:text-slate-200/70">
                Simulations and on-chain transactions appear here.
              </p>
            </div>
            <Button variant="ghost" size="icon" onClick={close} aria-label="Close activity">
              <X className="h-5 w-5" />
            </Button>
          </div>
          <div className="mt-6 flex-1 space-y-3 overflow-y-auto">
            {entries.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border p-6 text-center">
                <Clock className="mx-auto h-8 w-8 text-slate-950/30" />
                <p className="mt-4 text-sm text-slate-950/60 dark:text-slate-200/70">
                  Run a Tenderly simulation or send a transaction to see it logged here.
                </p>
              </div>
            ) : (
              entries.map((entry) => (
                <div key={entry.id} className="rounded-2xl border border-border bg-white/60 p-4 dark:bg-slate-950/40">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold">{entry.title}</p>
                      <p className="text-xs text-slate-950/60 dark:text-slate-200/70">{entry.subtitle}</p>
                    </div>
                    <span className={cn("text-xs font-medium", STATUS_COLOR[entry.status])}>{entry.status}</span>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-slate-950/50 dark:text-slate-200/60">
                    <time dateTime={entry.createdAt}>{new Date(entry.createdAt).toLocaleTimeString()}</time>
                    {entry.href ? (
                      <a
                        href={entry.href}
                        target="_blank"
                        rel="noreferrer"
                        className="font-medium text-accent underline-offset-4 hover:underline"
                      >
                        View tx
                      </a>
                    ) : null}
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.aside>
      ) : null}
    </AnimatePresence>
  );
}
