import * as React from "react";
import { ChevronDownIcon } from "lucide-react";
import { cn } from "@/lib/utils";

function NativeSelect({ className, ...props }: React.ComponentProps<"select">) {
  return (
    <div
      data-slot="native-select-wrapper"
      className="group/native-select relative min-w-0 has-[select:disabled]:opacity-50"
    >
      <select
        data-slot="native-select"
        className={cn(
          "border-input bg-background text-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:bg-input/30 h-10 w-full min-w-0 appearance-none rounded-lg border px-3 py-2 pr-9 text-base shadow-xs outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed md:text-sm [&>option]:bg-[Canvas] [&>option]:text-[CanvasText]",
          className
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
