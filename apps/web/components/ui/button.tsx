import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-lg text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-60 dark:focus-visible:ring-offset-slate-950",
  {
    variants: {
      variant: {
        primary: "bg-accent text-accent-foreground shadow-sm hover:bg-accent/90 dark:bg-accent dark:text-white dark:hover:bg-accent/80",
        secondary:
          "bg-slate-950/5 text-foreground hover:bg-slate-950/10 dark:bg-white/10 dark:text-slate-100 dark:hover:bg-white/20",
        ghost: "text-slate-950/80 hover:bg-slate-950/5 dark:text-slate-100 dark:hover:bg-white/10",
        outline:
          "border border-border bg-white text-foreground hover:bg-slate-950/5 dark:border-white/15 dark:bg-transparent dark:text-slate-100 dark:hover:bg-white/10",
        destructive: "bg-danger text-white hover:bg-danger/90 dark:bg-danger dark:text-white dark:hover:bg-danger/80"
      },
      size: {
        sm: "h-8 px-3",
        md: "h-10 px-4",
        lg: "h-12 px-6",
        icon: "h-10 w-10"
      }
    },
    defaultVariants: {
      variant: "primary",
      size: "md"
    }
  }
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
});
Button.displayName = "Button";

export { Button, buttonVariants };
