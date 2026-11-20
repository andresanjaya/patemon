"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface TableActionItem {
  label: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  href?: string;
  variant?: "default" | "destructive";
  disabled?: boolean;
}

export interface TableActionDropdownProps {
  items: TableActionItem[];
  title?: string;
  align?: "left" | "right";
  ariaLabel?: string;
  triggerAriaLabel?: string;
}

export function TableActionDropdown({
  items,
  title = "Actions",
  align = "right",
  ariaLabel = "Menu tindakan",
  triggerAriaLabel,
}: TableActionDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const effectiveAriaLabel = triggerAriaLabel || ariaLabel;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  // Filter out invalid items if any
  const validItems = items.filter(Boolean);

  if (validItems.length === 0) return null;

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <Button
        variant="ghost"
        size={null}
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="border-border h-8 w-8 rounded-lg border shadow-2xs"
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-label={effectiveAriaLabel}
      >
        <MoreVertical className="h-4 w-4" />
      </Button>

      {isOpen && (
        <div
          role="menu"
          aria-orientation="vertical"
          className={`dark:border-border/80 dark:bg-card absolute top-full z-50 mt-1.5 w-44 rounded-xl border border-[#e5e5e9] bg-white py-1.5 shadow-lg transition-all focus:outline-hidden ${
            align === "right" ? "right-0" : "left-0"
          }`}
        >
          {title && (
            <div className="dark:text-muted-foreground px-3 py-1.5 text-[11px] font-semibold tracking-wider text-zinc-400 uppercase">
              {title}
            </div>
          )}

          <div className="py-0.5">
            {validItems.map((item, idx) => {
              const isDestructive = item.variant === "destructive";
              const itemClass = `flex w-full items-center gap-2.5 px-3 py-2 text-xs font-medium transition-colors ${
                item.disabled
                  ? "opacity-50 cursor-not-allowed text-zinc-400"
                  : isDestructive
                    ? "text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40"
                    : "text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-muted dark:hover:text-foreground"
              }`;

              if (item.href && !item.disabled) {
                return (
                  <Link
                    key={idx}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={itemClass}
                    role="menuitem"
                  >
                    {item.icon && (
                      <span className="shrink-0 [&>svg]:h-3.5 [&>svg]:w-3.5">
                        {item.icon}
                      </span>
                    )}
                    <span>{item.label}</span>
                  </Link>
                );
              }

              return (
                <Button
                  variant="ghost"
                  size={null}
                  key={idx}
                  type="button"
                  disabled={item.disabled}
                  onClick={() => {
                    if (item.disabled) return;
                    setIsOpen(false);
                    item.onClick?.();
                  }}
                  className={itemClass}
                  role="menuitem"
                >
                  {item.icon && (
                    <span className="shrink-0 [&>svg]:h-3.5 [&>svg]:w-3.5">
                      {item.icon}
                    </span>
                  )}
                  <span>{item.label}</span>
                </Button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
