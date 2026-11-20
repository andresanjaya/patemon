"use client";

import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { MoreVertical } from "lucide-react";

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
  const menuRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const effectiveAriaLabel = triggerAriaLabel || ariaLabel;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !menuRef.current?.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
        dropdownRef.current?.querySelector("button")?.focus();
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    const closeMenu = (event: Event) => {
      if (!menuRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    if (isOpen) {
      window.addEventListener("scroll", closeMenu, true);
      window.addEventListener("resize", closeMenu);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("scroll", closeMenu, true);
      window.removeEventListener("resize", closeMenu);
    };
  }, [isOpen]);

  // Filter out invalid items if any
  const validItems = items.filter(Boolean);

  if (validItems.length === 0) return null;

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={(event) => {
          const rect = event.currentTarget.getBoundingClientRect();
          const menuHeight = Math.min(
            window.innerHeight - 16,
            items.length * 40 + (title ? 40 : 12)
          );
          setPosition({
            top:
              window.innerHeight - rect.bottom >= menuHeight + 8
                ? rect.bottom + 6
                : Math.max(8, rect.top - menuHeight - 6),
            left: Math.max(
              8,
              Math.min(
                align === "right" ? rect.right - 176 : rect.left,
                window.innerWidth - 184
              )
            ),
          });
          setIsOpen((prev) => !prev);
        }}
        className="dark:border-border/80 dark:bg-card dark:text-muted-foreground dark:hover:bg-muted dark:hover:text-foreground flex h-8 w-8 items-center justify-center rounded-lg border border-[#e5e5e9] bg-white text-zinc-500 shadow-2xs transition-colors hover:bg-zinc-100 hover:text-zinc-900 focus:ring-2 focus:ring-amber-500/20 focus:outline-hidden"
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-label={effectiveAriaLabel}
      >
        <MoreVertical className="h-4 w-4" />
      </button>

      {isOpen &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            aria-orientation="vertical"
            style={{
              top: position.top,
              left: position.left,
              maxHeight: `calc(100dvh - ${position.top + 8}px)`,
            }}
            className="dark:border-border/80 dark:bg-card fixed z-50 w-44 overflow-y-auto rounded-xl border border-[#e5e5e9] bg-white py-1.5 shadow-lg focus:outline-hidden"
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
                  <button
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
                  </button>
                );
              })}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
