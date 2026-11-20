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
        "dark:bg-card dark:border-border/80 flex flex-col justify-between gap-5 rounded-xl border border-[#e5e5e9] bg-white p-4 shadow-xs sm:p-5 md:flex-row md:items-center",
        className
      )}
    >
      {/* Left Section: Primary Headline Metric */}
      <div className="flex min-w-[200px] shrink-0 flex-col">
        <span className="dark:text-muted-foreground text-xs font-medium text-[#71717a]">
          {headlineLabel}
        </span>
        <div className="dark:text-foreground mt-0.5 text-2xl font-bold tracking-tight text-[#18181b]">
          {headlineValue}
        </div>
        {subHeadline && (
          <span className="dark:text-muted-foreground mt-0.5 text-[11px] text-[#71717a]">
            {subHeadline}
          </span>
        )}
      </div>

      {/* Vertical Divider Line */}
      <div className="dark:bg-border/80 hidden h-11 w-px shrink-0 bg-[#e5e5e9] md:block" />

      {/* Right Section: Proportional Segmented Bar & Metric Dots */}
      <div className="flex min-w-0 flex-1 flex-col justify-center">
        {/* Breakdown Title & Interactive Hint */}
        <div className="mb-2 flex items-center justify-between gap-2">
          <span className="dark:text-foreground text-xs font-semibold text-[#18181b]">
            {breakdownTitle}
          </span>
          {onItemClick && (
            <span className="text-muted-foreground/80 hidden text-[10px] sm:inline-block">
              (Klik metrik untuk memfilter)
            </span>
          )}
        </div>

        {/* Multi-Color Segmented Progress Bar */}
        <div className="dark:bg-muted mb-2.5 flex h-2 w-full gap-1 overflow-hidden rounded-full bg-zinc-100">
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
                    "h-full cursor-pointer rounded-full transition-all hover:opacity-80 focus:outline-hidden",
                    item.color,
                    isActive &&
                      "scale-y-125 ring-2 ring-zinc-400 ring-offset-1 dark:ring-zinc-600"
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
        <div className="dark:text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-[#71717a]">
          {items.map((item, idx) => {
            const itemKey = item.id || item.label;
            const isActive = activeItemId === itemKey;
            const isClickable = Boolean(onItemClick);

            const content = (
              <>
                <span
                  className={cn("h-2 w-2 shrink-0 rounded-full", item.color)}
                />
                <span>{item.label}:</span>
                <strong className="dark:text-foreground font-semibold text-[#18181b]">
                  {item.value}
                </strong>
                {isActive && (
                  <span
                    className="text-muted-foreground hover:text-foreground ml-0.5 text-[10px]"
                    aria-hidden="true"
                  >
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
                    "dark:hover:bg-muted/70 hover:text-foreground -mx-1.5 flex cursor-pointer items-center gap-1.5 rounded-md px-1.5 py-0.5 text-left transition-all hover:bg-zinc-100",
                    isActive &&
                      "dark:bg-muted text-foreground bg-zinc-100 font-semibold shadow-2xs ring-1 ring-zinc-300 dark:ring-zinc-700"
                  )}
                  title={
                    isActive
                      ? `Hapus filter ${item.label}`
                      : `Filter data: ${item.label}`
                  }
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
