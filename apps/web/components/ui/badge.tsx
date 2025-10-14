import * as React from "react";

import { cn } from "@/lib/utils";

const VARIANTS = {
  default: "bg-slate-950/5 text-foreground",
  secondary: "bg-slate-950/10 text-foreground",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  danger: "bg-danger/10 text-danger",
  outline: "border border-border/80 bg-transparent text-foreground dark:border-white/20 dark:text-white",
  accent: "bg-accent/10 text-accent"
} as const;

type Variant = keyof typeof VARIANTS;

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: Variant;
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-pill px-2.5 py-1 text-xs font-semibold uppercase tracking-wide",
        VARIANTS[variant],
        className
      )}
      {...props}
    />
  );
}
