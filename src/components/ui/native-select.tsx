import * as React from "react";
import { ChevronDownIcon } from "lucide-react";
import { cn } from "@/lib/utils";

function NativeSelect({
  className,
  wrapLabel,
  ...props
}: React.ComponentProps<"select"> & { wrapLabel?: string }) {
  return (
    <div
      data-slot="native-select-wrapper"
      className="group/native-select has-[select:focus-visible]:ring-ring relative min-w-0 has-[select:disabled]:opacity-50 has-[select:focus-visible]:rounded-lg has-[select:focus-visible]:ring-2"
    >
      {wrapLabel && (
        <span
          aria-hidden="true"
          className={cn(
            "border-input bg-background text-foreground block rounded-lg border px-3 py-2 text-sm shadow-xs",
            className,
            "h-auto min-h-6 pr-7 [overflow-wrap:anywhere] whitespace-normal"
          )}
        >
          {wrapLabel}
        </span>
      )}
      <select
        data-slot="native-select"
        className={cn(
          "border-input bg-background text-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:bg-input/30 h-10 w-full min-w-0 appearance-none rounded-lg border px-3 py-2 pr-9 text-base shadow-xs outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed md:text-sm [&>option]:bg-[Canvas] [&>option]:text-[CanvasText]",
          className,
          wrapLabel && "absolute inset-0 h-full cursor-pointer opacity-0"
        )}
        {...props}
      />
      <ChevronDownIcon
        aria-hidden="true"
        className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2"
      />
    </div>
  );
}

function NativeSelectOption(props: React.ComponentProps<"option">) {
  return <option data-slot="native-select-option" {...props} />;
}

function NativeSelectOptGroup(props: React.ComponentProps<"optgroup">) {
  return <optgroup data-slot="native-select-optgroup" {...props} />;
}

export { NativeSelect, NativeSelectOption, NativeSelectOptGroup };
