"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Search, Check, X } from "lucide-react";

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
}

export function TableDropdownFilter({
  label,
  options,
  value,
  onChange,
  defaultAllId = "all",
  placeholderSearch,
  className = "",
}: TableDropdownFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

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
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`flex h-9 items-center justify-between gap-1.5 rounded-lg border px-3 text-xs font-medium transition-colors shadow-2xs focus:outline-hidden ${
          isFiltered
            ? "border-amber-500/60 bg-amber-50/70 text-amber-900 dark:border-amber-700/60 dark:bg-amber-950/40 dark:text-amber-200"
            : "border-[#e5e5e9] bg-white text-zinc-700 hover:bg-zinc-50 dark:border-border/80 dark:bg-card dark:text-zinc-200 dark:hover:bg-muted"
        }`}
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-1.5 truncate">
          {isFiltered && (
            <span
              className="h-1.5 w-1.5 rounded-full bg-amber-600 dark:bg-amber-400 shrink-0"
              aria-hidden="true"
            />
          )}
          <span className="truncate max-w-[130px]">
            {isFiltered && selectedOption ? selectedOption.label : label}
          </span>
        </div>
        <ChevronDown className="h-3.5 w-3.5 shrink-0 text-zinc-400 dark:text-muted-foreground" />
      </button>

      {isOpen && (
        <div
          role="listbox"
          className="absolute left-0 top-full z-50 mt-1.5 w-56 rounded-xl border border-[#e5e5e9] bg-white p-1.5 shadow-lg dark:border-border/80 dark:bg-card"
        >
          {/* Header with Quick Clear if Filtered */}
          {isFiltered && (
            <div className="flex items-center justify-between px-2 py-1 mb-1 border-b border-[#f0f0f4] dark:border-border/60 text-[11px]">
              <span className="text-muted-foreground">Filter Aktif</span>
              <button
                type="button"
                onClick={() => {
                  onChange(defaultAllId);
                  setIsOpen(false);
                  setSearch("");
                }}
                className="flex items-center gap-1 text-amber-700 dark:text-amber-300 hover:underline font-medium"
              >
                <X className="h-3 w-3" />
                <span>Reset</span>
              </button>
            </div>
          )}

          {options.length > 5 && (
            <div className="relative mb-1.5 border-b border-[#f0f0f4] pb-1.5 dark:border-border/60">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-400 dark:text-muted-foreground" />
              <input
                type="text"
                placeholder={placeholderSearch || `Cari ${label.toLowerCase()}...`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-md bg-zinc-50 py-1.5 pl-8 pr-2.5 text-xs text-zinc-900 placeholder-zinc-400 focus:bg-white focus:outline-hidden dark:bg-muted dark:text-foreground dark:placeholder-muted-foreground"
              />
            </div>
          )}

          <div className="max-h-56 overflow-y-auto py-0.5 space-y-0.5">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-2 text-center text-xs text-zinc-400 dark:text-muted-foreground">
                Tidak ada pilihan
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = opt.id === value;
                return (
                  <button
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
                        : "text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-muted dark:hover:text-foreground"
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
                      <span className="ml-2 text-[11px] font-mono text-zinc-400 dark:text-muted-foreground">
                        {opt.count}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
