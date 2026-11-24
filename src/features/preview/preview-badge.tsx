"use client";

import { Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface PreviewBadgeProps {
  className?: string;
  onClick?: () => void;
}

/**
 * Standard persistent yet lightweight indicator for preview mode data across all module headers and toolbars.
 * Conforms to Issue #113 requirement: "Beri label persisten namun ringan: Mode pratinjau · Data contoh".
 */
export function PreviewBadge({ className = "", onClick }: PreviewBadgeProps) {
  return (
    <Badge
      variant="outline"
      onClick={onClick}
      className={cn(
        "h-6 gap-1.5 rounded-full border-amber-300/80 bg-amber-50/90 px-2.5 py-0.5 text-[11px] font-semibold text-amber-900 shadow-2xs transition-colors dark:border-amber-700/60 dark:bg-amber-950/40 dark:text-amber-200",
        onClick && "cursor-pointer hover:bg-amber-100 dark:hover:bg-amber-900/50",
        className
      )}
      title="Anda sedang menjelajahi data contoh dalam mode pratinjau. Aktifkan akses penuh untuk mulai merencanakan."
    >
      <Sparkles className="h-3 w-3 shrink-0 text-amber-600 dark:text-amber-400" />
      <span>Mode pratinjau · Data contoh</span>
    </Badge>
  );
}
