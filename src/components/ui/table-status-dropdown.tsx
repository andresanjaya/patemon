"use client";

import React from "react";
import { ChevronDown, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface StatusOption {
  value: string;
  label: string;
  badgeClass?: string;
}

export interface TableStatusDropdownProps {
  value: string;
  options: StatusOption[];
  onChange: (value: string) => void;
  disabled?: boolean;
  ariaLabel?: string;
  className?: string;
}

export function TableStatusDropdown({
  value,
  options,
  onChange,
  disabled = false,
  ariaLabel,
  className = "",
}: TableStatusDropdownProps) {
  const currentOption = options.find((opt) => opt.value === value) || {
    value,
    label: value,
  };

  if (disabled) {
    return (
      <span
        className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium shadow-2xs ${
          currentOption.badgeClass || className
        }`}
      >
        {currentOption.label}
      </span>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size={null}
          type="button"
          aria-label={ariaLabel || `Ubah status: ${currentOption.label}`}
          className={`group/status inline-flex h-6 cursor-pointer items-center justify-between gap-1 rounded-md border px-2 text-[11px] font-medium shadow-2xs transition-colors hover:opacity-90 ${
            currentOption.badgeClass || className
          }`}
        >
          <span className="truncate">{currentOption.label}</span>
          <ChevronDown className="h-3 w-3 shrink-0 opacity-60 transition-transform group-data-[state=open]/status:rotate-180" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-36 p-1">
        <DropdownMenuGroup>
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <DropdownMenuItem
                key={option.value}
                onClick={() => onChange(option.value)}
                className={`flex cursor-pointer items-center justify-between gap-2 px-2.5 py-1.5 text-xs font-medium ${
                  isSelected ? "bg-accent/70 font-semibold" : ""
                }`}
              >
                <span>{option.label}</span>
                {isSelected && (
                  <Check className="h-3.5 w-3.5 shrink-0 text-primary" />
                )}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
