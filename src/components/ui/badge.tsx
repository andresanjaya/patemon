import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * KtUI Badge Component (https://ktui.io/docs/badge)
 * Metronic Demo 10 & KtUI standard with soft, outline, and solid styles.
 */
const badgeVariants = cva(
  "kt-badge inline-flex items-center justify-center font-medium transition-colors focus:outline-hidden focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "kt-badge-primary bg-primary text-primary-foreground",
        primary:
          "kt-badge-primary bg-blue-600 text-white",
        secondary:
          "kt-badge-secondary bg-[#f4f4f7] text-[#65656f] dark:bg-muted dark:text-muted-foreground",
        destructive:
          "kt-badge-destructive bg-destructive text-destructive-foreground",
        outline:
          "kt-badge-outline border border-[#e9e9ed] bg-[#f9f9fb] text-[#18181b] dark:border-border dark:bg-muted/30 dark:text-foreground",
        success:
          "kt-badge-success bg-emerald-600 text-white",
        warning:
          "kt-badge-warning bg-amber-500 text-white",
        info:
          "kt-badge-info bg-violet-600 text-white",
        mono:
          "kt-badge-mono bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900",
      },
      appearance: {
        solid: "",
        outline: "kt-badge-outline",
        light: "kt-badge-light",
      },
      size: {
        default: "kt-badge h-6 px-2 text-xs rounded-md gap-1.5",
        xs: "kt-badge-xs h-4 px-1 text-[10px] leading-none rounded-xs gap-1",
        sm: "kt-badge-sm h-5 px-1.5 text-[11px] leading-tight rounded-sm gap-1",
        md: "kt-badge h-6 px-2 text-xs rounded-md gap-1.5",
        lg: "kt-badge-lg h-7 px-2.5 text-xs rounded-md gap-1.5",
      },
    },
    compoundVariants: [
      {
        variant: "outline",
        appearance: "outline",
        className:
          "border border-[#e9e9ed] bg-[#f9f9fb] text-[#18181b] dark:border-border dark:bg-muted/30 dark:text-foreground",
      },
      {
        variant: "success",
        appearance: "outline",
        className:
          "border border-green-200 bg-green-50 text-green-700 dark:bg-green-950/40 dark:border-green-950 dark:text-green-400",
      },
      {
        variant: "warning",
        appearance: "outline",
        className:
          "border border-amber-200 bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:border-amber-950 dark:text-amber-400",
      },
      {
        variant: "destructive",
        appearance: "outline",
        className:
          "border border-red-200 bg-red-50 text-red-700 dark:bg-red-950/40 dark:border-red-950 dark:text-red-400",
      },
      {
        variant: "primary",
        appearance: "outline",
        className:
          "border border-blue-200 bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:border-blue-950 dark:text-blue-400",
      },
      {
        variant: "info",
        appearance: "outline",
        className:
          "border border-violet-200 bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:border-violet-950 dark:text-violet-400",
      },
      {
        variant: "secondary",
        appearance: "outline",
        className:
          "border border-[#e9e9ed] bg-[#f4f4f7] text-[#65656f] dark:border-border dark:bg-secondary/40 dark:text-muted-foreground",
      },
      {
        variant: "default",
        appearance: "outline",
        className:
          "border border-primary/30 bg-primary/10 text-primary",
      },
    ],
    defaultVariants: {
      variant: "default",
      appearance: "solid",
      size: "default",
    },
  }
);

export interface BadgeProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, appearance, size, ...props }: BadgeProps) {
  // If variant is outline, default appearance to outline as well
  const effectiveAppearance =
    appearance || (variant === "outline" ? "outline" : "solid");

  return (
    <div
      className={cn(
        badgeVariants({
          variant,
          appearance: effectiveAppearance,
          size,
        }),
        className
      )}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
