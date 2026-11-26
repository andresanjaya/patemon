import * as React from "react";
import { Button } from "@/components/ui/button";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const alertVariants = cva(
  "relative w-full rounded-lg border p-4 text-sm transition-all [&>svg~[data-slot=alert-title]]:pl-7 [&>svg~[data-slot=alert-description]]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground",
  {
    variants: {
      variant: {
        default: "bg-background text-foreground border-border",
        info: "border-blue-300 bg-blue-50/90 text-blue-950 [&>svg]:text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-100 dark:[&>svg]:text-blue-300",
        success:
          "border-emerald-300 bg-emerald-50/90 text-emerald-950 [&>svg]:text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-100 dark:[&>svg]:text-emerald-300",
        warning:
          "border-amber-300 bg-amber-50/90 text-amber-950 [&>svg]:text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100 dark:[&>svg]:text-amber-300",
        destructive:
          "border-rose-300 bg-rose-50/90 text-rose-950 [&>svg]:text-rose-700 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-100 dark:[&>svg]:text-rose-300",
      },
      appearance: {
        light: "shadow-xs",
        outline: "bg-transparent",
        solid: "text-white shadow-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      appearance: "light",
    },
  }
);

export interface AlertProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {
  close?: boolean;
  onClose?: () => void;
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  (
    { className, variant, appearance, close, onClose, children, ...props },
    ref
  ) => {
    return (
      <div
        ref={ref}
        role={variant === "success" || variant === "info" ? "status" : "alert"}
        className={cn(
          alertVariants({ variant, appearance }),
          close && "pr-12",
          className
        )}
        {...props}
      >
        {children}
        {close && (
          <Button
            variant="ghost"
            size={null}
            type="button"
            onClick={onClose}
            className="absolute top-1 right-1 size-11 rounded-md"
            aria-label="Tutup"
          >
            <span className="text-sm leading-none font-semibold">×</span>
          </Button>
        )}
      </div>
    );
  }
);
Alert.displayName = "Alert";

const AlertIcon = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "absolute top-4 left-4 flex items-center justify-center",
      className
    )}
    {...props}
  />
));
AlertIcon.displayName = "AlertIcon";

const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    data-slot="alert-title"
    ref={ref}
    className={cn("mb-1 leading-none font-semibold tracking-tight", className)}
    {...props}
  />
));
AlertTitle.displayName = "AlertTitle";

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-slot="alert-description"
    className={cn("text-xs leading-relaxed opacity-90 sm:text-sm", className)}
    {...props}
  />
));
AlertDescription.displayName = "AlertDescription";

const AlertAction = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-slot="alert-action"
    className={cn("absolute top-3 right-3", className)}
    {...props}
  />
));
AlertAction.displayName = "AlertAction";

export { Alert, AlertIcon, AlertTitle, AlertDescription, AlertAction };
