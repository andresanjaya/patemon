"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Search, Check, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export interface FilterOption {
  id: string;
  label: string;
  count?: number;
}

export interface TableDropdownFilterProps {
  label: string;
  options: FilterOption[];
  value: string;
  onChange: (value: string) => void;
  defaultAllId?: string;
  placeholderSearch?: string;
  className?: string;
  align?: "start" | "end" | "auto";
}

export function TableDropdownFilter({
  label,
  options,
  value,
  onChange,
  defaultAllId = "all",
  placeholderSearch,
  className = "",
  align = "auto",
}: TableDropdownFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [effectiveAlign, setEffectiveAlign] = useState<"start" | "end">("start");
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    if (dropdownRef.current) {
      const rect = dropdownRef.current.getBoundingClientRect();
      const screenWidth = window.innerWidth;
      const dropdownWidth = 224;

      const fitsRight = rect.left + dropdownWidth <= screenWidth - 16;
      const fitsLeft = rect.right - dropdownWidth >= 16;

      if (align === "end") {
        if (!fitsLeft && fitsRight) {
          setEffectiveAlign("start");
        } else {
          setEffectiveAlign("end");
        }
      } else if (align === "start") {
        if (!fitsRight && fitsLeft) {
          setEffectiveAlign("end");
        } else {
          setEffectiveAlign("start");
        }
      } else {
        // auto
        if (!fitsRight && fitsLeft) {
          setEffectiveAlign("end");
        } else {
          setEffectiveAlign("start");
        }
      }
    }
  }, [isOpen, align]);

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

  const isFiltered = value !== defaultAllId && value !== "Semua";
  const selectedOption = options.find((opt) => opt.id === value);

  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div
      className={`relative inline-block text-left ${className}`}
      ref={dropdownRef}
    >
      <Button
        variant="ghost"
        size={null}
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`flex h-9 items-center justify-between gap-1.5 rounded-lg border px-2.5 text-xs font-medium shadow-2xs transition-colors focus:outline-hidden ${
          isFiltered
            ? "border-amber-500/60 bg-amber-50/70 text-amber-900 dark:border-amber-700/60 dark:bg-amber-950/40 dark:text-amber-200"
            : "dark:border-border/80 dark:bg-card dark:hover:bg-muted border-[#e5e5e9] bg-white text-zinc-700 hover:bg-zinc-50 dark:text-zinc-200"
        }`}
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-1.5 truncate">
          {isFiltered && (
            <span
              className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-600 dark:bg-amber-400"
              aria-hidden="true"
            />
          )}
          <span className="max-w-[130px] truncate">
            {isFiltered && selectedOption ? selectedOption.label : label}
          </span>
        </div>
        <ChevronDown className="dark:text-muted-foreground h-3.5 w-3.5 shrink-0 text-zinc-400" />
      </Button>

      {isOpen && (
        <div
          role="listbox"
          className={`dark:border-border/80 dark:bg-card absolute top-full z-50 mt-1.5 w-56 max-w-[calc(100vw-2rem)] rounded-xl border border-[#e5e5e9] bg-white p-1.5 shadow-lg ${
            effectiveAlign === "end" ? "right-0" : "left-0"
          }`}
        >
          {/* Header with Quick Clear if Filtered */}
          {isFiltered && (
            <div className="dark:border-border/60 mb-1 flex items-center justify-between border-b border-[#f0f0f4] px-2 py-1 text-[11px]">
              <span className="text-muted-foreground">Filter Aktif</span>
              <Button
                variant="ghost"
                size={null}
                type="button"
                onClick={() => {
                  onChange(defaultAllId);
                  setIsOpen(false);
                  setSearch("");
                }}
                className="gap-1 font-medium"
              >
                <X className="h-3 w-3" />
                <span>Reset</span>
              </Button>
            </div>
          )}

          {options.length > 5 && (
            <div className="dark:border-border/60 relative mb-1.5 border-b border-[#f0f0f4] pb-1.5">
              <Search className="dark:text-muted-foreground absolute top-2.5 left-2.5 h-3.5 w-3.5 text-zinc-400" />
              <Input
                type="text"
                placeholder={
                  placeholderSearch || `Cari ${label.toLowerCase()}...`
                }
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="dark:bg-muted dark:text-foreground dark:placeholder-muted-foreground w-full rounded-md bg-zinc-50 py-1.5 pr-2.5 pl-8 text-xs text-zinc-900 placeholder-zinc-400 focus:bg-white focus:outline-hidden"
              />
            </div>
          )}

          <div className="max-h-56 space-y-0.5 overflow-y-auto py-0.5">
            {filteredOptions.length === 0 ? (
              <div className="dark:text-muted-foreground px-3 py-2 text-center text-xs text-zinc-400">
                Tidak ada pilihan
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = opt.id === value;
                return (
                  <Button
                    variant="ghost"
                    size={null}
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      onChange(opt.id);
                      setIsOpen(false);
                      setSearch("");
                    }}
                    className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs transition-colors ${
                      isSelected
                        ? "bg-amber-50 font-semibold text-amber-900 dark:bg-amber-950/40 dark:text-amber-200"
                        : "dark:hover:bg-muted dark:hover:text-foreground text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300"
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <div
                        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-md border ${
                          isSelected
                            ? "border-amber-600 bg-amber-600 text-white dark:border-amber-500 dark:bg-amber-500"
                            : "border-zinc-300 bg-white dark:border-zinc-600 dark:bg-zinc-800"
                        }`}
                      >
                        {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                      </div>
                      <span className="truncate">{opt.label}</span>
                    </div>

                    {typeof opt.count === "number" && (
                      <span className="dark:text-muted-foreground ml-2 font-mono text-[11px] text-zinc-400">
                        {opt.count}
                      </span>
                    )}
                  </Button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
