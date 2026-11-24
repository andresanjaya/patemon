"use client";

import React from "react";
import Link from "next/link";
import { MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  const validItems = items.filter(Boolean);
  if (validItems.length === 0) return null;

  const effectiveAriaLabel = triggerAriaLabel || ariaLabel;
  const menuAlign = align === "left" ? "start" : "end";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size={null}
          type="button"
          aria-label={effectiveAriaLabel}
          className="border-border h-8 w-8 rounded-lg border shadow-2xs hover:bg-muted"
        >
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={menuAlign} className="w-44 p-1">
        {title && (
          <DropdownMenuLabel className="px-3 py-1.5 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
            {title}
          </DropdownMenuLabel>
        )}
        <DropdownMenuGroup>
          {validItems.map((item, idx) => {
            const isDestructive = item.variant === "destructive";

            if (item.href && !item.disabled) {
              return (
                <DropdownMenuItem
                  key={idx}
                  asChild
                  variant={isDestructive ? "destructive" : "default"}
                  className="cursor-pointer"
                >
                  <Link href={item.href} className="flex w-full items-center gap-2.5">
                    {item.icon && (
                      <span className="shrink-0 [&>svg]:h-3.5 [&>svg]:w-3.5">
                        {item.icon}
                      </span>
                    )}
                    <span>{item.label}</span>
                  </Link>
                </DropdownMenuItem>
              );
            }

            return (
              <DropdownMenuItem
                key={idx}
                disabled={item.disabled}
                variant={isDestructive ? "destructive" : "default"}
                onClick={item.onClick}
                className="cursor-pointer"
              >
                {item.icon && (
                  <span className="shrink-0 [&>svg]:h-3.5 [&>svg]:w-3.5">
                    {item.icon}
                  </span>
                )}
                <span>{item.label}</span>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
