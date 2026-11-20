import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const alertVariants = cva(
  "relative w-full rounded-lg border p-4 text-sm transition-all [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground",
  {
    variants: {
      variant: {
        default: "bg-background text-foreground border-border",
        info: "border-blue-300 bg-blue-50/90 text-blue-950 [&>svg]:text-blue-700",
        success:
          "border-emerald-300 bg-emerald-50/90 text-emerald-950 [&>svg]:text-emerald-700",
        warning:
          "border-amber-300 bg-amber-50/90 text-amber-950 [&>svg]:text-amber-700",
        destructive:
          "border-rose-300 bg-rose-50/90 text-rose-950 [&>svg]:text-rose-700",
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
        role="alert"
        className={cn(alertVariants({ variant, appearance }), className)}
        {...props}
      >
        {children}
        {close && (
          <button
            type="button"
            onClick={onClose}
            className="text-foreground/60 absolute top-3 right-3 inline-flex size-5 cursor-pointer items-center justify-center rounded-md opacity-70 transition-opacity hover:opacity-100 focus:outline-hidden"
            aria-label="Tutup"
          >
            <span className="text-sm leading-none font-semibold">×</span>
          </button>
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
    className={cn("text-xs leading-relaxed opacity-90 sm:text-sm", className)}
    {...props}
  />
));
AlertDescription.displayName = "AlertDescription";

export { Alert, AlertIcon, AlertTitle, AlertDescription };
