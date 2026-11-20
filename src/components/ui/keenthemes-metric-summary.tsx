"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface MetricBreakdownItem {
  id?: string; // Identifier for click/filter events
  label: string;
  value: number | string;
  color: string; // Tailwind background color class, e.g. "bg-emerald-500", "bg-amber-500", "bg-rose-500"
  barWeight?: number; // Optional numerical weight for proportional bar width
}

export interface KeenthemesMetricSummaryProps {
  headlineLabel: string;
  headlineValue: string | number;
  subHeadline?: string;
  breakdownTitle: string;
  items: MetricBreakdownItem[];
  className?: string;
  activeItemId?: string | null;
  onItemClick?: (id: string, item: MetricBreakdownItem) => void;
}

/**
 * Keenthemes / Metronic Demo 10 Standardized Compact Metric Summary Bar
 * Replaces bulky multi-card KPI grids with a clean, unified single-row widget
 * that keeps the primary focus on the data table below it.
 *
 * Supports interactive filtering when onItemClick and activeItemId are provided.
 */
export function KeenthemesMetricSummary({
  headlineLabel,
  headlineValue,
  subHeadline,
  breakdownTitle,
  items,
  className,
  activeItemId,
  onItemClick,
}: KeenthemesMetricSummaryProps) {
  // Calculate total bar weight for proportional segments
  const totalWeight = items.reduce((sum, item) => {
    const weight =
      typeof item.barWeight === "number"
        ? item.barWeight
        : typeof item.value === "number"
          ? item.value
          : 0;
    return sum + (weight > 0 ? weight : 0);
  }, 0);

  return (
    <div
      className={cn(
        "rounded-xl border border-[#e5e5e9] bg-white p-4 sm:p-5 shadow-xs dark:bg-card dark:border-border/80 flex flex-col md:flex-row md:items-center justify-between gap-5",
        className
      )}
    >
      {/* Left Section: Primary Headline Metric */}
      <div className="flex flex-col shrink-0 min-w-[200px]">
        <span className="text-xs font-medium text-[#71717a] dark:text-muted-foreground">
          {headlineLabel}
        </span>
        <div className="text-2xl font-bold text-[#18181b] dark:text-foreground tracking-tight mt-0.5">
          {headlineValue}
        </div>
        {subHeadline && (
          <span className="text-[11px] text-[#71717a] dark:text-muted-foreground mt-0.5">
            {subHeadline}
          </span>
        )}
      </div>

      {/* Vertical Divider Line */}
      <div className="hidden md:block w-px h-11 bg-[#e5e5e9] dark:bg-border/80 shrink-0" />

      {/* Right Section: Proportional Segmented Bar & Metric Dots */}
      <div className="flex-1 flex flex-col justify-center min-w-0">
        {/* Breakdown Title & Interactive Hint */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-xs font-semibold text-[#18181b] dark:text-foreground">
            {breakdownTitle}
          </span>
          {onItemClick && (
            <span className="text-[10px] text-muted-foreground/80 hidden sm:inline-block">
              (Klik metrik untuk memfilter)
            </span>
          )}
        </div>

        {/* Multi-Color Segmented Progress Bar */}
        <div className="flex h-2 w-full gap-1 overflow-hidden rounded-full bg-zinc-100 dark:bg-muted mb-2.5">
          {items.map((item, idx) => {
            const weight =
              typeof item.barWeight === "number"
                ? item.barWeight
                : typeof item.value === "number"
                  ? item.value
                  : 0;
            const pct =
              totalWeight > 0 ? Math.max((weight / totalWeight) * 100, 0) : 0;
            if (pct <= 0) return null;

            const itemKey = item.id || item.label;
            const isActive = activeItemId === itemKey;

            if (onItemClick) {
              return (
                <button
                  type="button"
                  key={idx}
                  onClick={() => onItemClick(itemKey, item)}
                  className={cn(
                    "h-full rounded-full transition-all cursor-pointer hover:opacity-80 focus:outline-hidden",
                    item.color,
                    isActive && "ring-2 ring-offset-1 ring-zinc-400 dark:ring-zinc-600 scale-y-125"
                  )}
                  style={{ width: `${pct}%` }}
                  title={`Filter ${item.label}: ${item.value}`}
                  aria-label={`Filter ${item.label}: ${item.value}`}
                />
              );
            }

            return (
              <div
                key={idx}
                className={cn("h-full rounded-full transition-all", item.color)}
                style={{ width: `${pct}%` }}
                title={`${item.label}: ${item.value}`}
              />
            );
          })}
        </div>

        {/* Metric Dots Legend */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-[#71717a] dark:text-muted-foreground">
          {items.map((item, idx) => {
            const itemKey = item.id || item.label;
            const isActive = activeItemId === itemKey;
            const isClickable = Boolean(onItemClick);

            const content = (
              <>
                <span className={cn("h-2 w-2 rounded-full shrink-0", item.color)} />
                <span>{item.label}:</span>
                <strong className="text-[#18181b] dark:text-foreground font-semibold">
                  {item.value}
                </strong>
                {isActive && (
                  <span className="text-[10px] ml-0.5 text-muted-foreground hover:text-foreground" aria-hidden="true">
                    ✕
                  </span>
                )}
              </>
            );

            if (isClickable) {
              return (
                <button
                  type="button"
                  key={idx}
                  onClick={() => onItemClick!(itemKey, item)}
                  className={cn(
                    "flex items-center gap-1.5 transition-all text-left rounded-md px-1.5 py-0.5 -mx-1.5 cursor-pointer hover:bg-zinc-100 dark:hover:bg-muted/70 hover:text-foreground",
                    isActive &&
                      "bg-zinc-100 dark:bg-muted font-semibold text-foreground ring-1 ring-zinc-300 dark:ring-zinc-700 shadow-2xs"
                  )}
                  title={isActive ? `Hapus filter ${item.label}` : `Filter data: ${item.label}`}
                >
                  {content}
                </button>
              );
            }

            return (
              <div key={idx} className="flex items-center gap-1.5">
                {content}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
