"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronDown,
  CalendarHeart,
  Plus,
  Check,
  LayoutGrid,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { WorkspaceRole, WorkspaceSummary } from "../types";

interface WorkspaceSwitcherProps {
  currentWorkspaceId: string;
  currentTitle: string;
  userRole: WorkspaceRole;
  workspaces: WorkspaceSummary[];
}

export function WorkspaceSwitcher({
  currentWorkspaceId,
  currentTitle,
  userRole,
  workspaces,
}: WorkspaceSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
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
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getRoleLabel = (role: WorkspaceRole) => {
    switch (role) {
      case "owner":
        return "Pemilik";
      case "editor":
        return "Editor";
      case "viewer":
        return "Pelihat";
      default:
        return role;
    }
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="border-border/80 flex items-center gap-2 shadow-xs"
      >
        <CalendarHeart className="text-primary h-4 w-4" />
        <span className="max-w-[180px] truncate font-medium sm:max-w-[240px]">
          {currentTitle}
        </span>
        <Badge variant="secondary" className="text-[10px] uppercase">
          {getRoleLabel(userRole)}
        </Badge>
        <ChevronDown className="text-muted-foreground h-3.5 w-3.5" />
      </Button>

      {isOpen && (
        <div className="border-border bg-popover text-popover-foreground absolute left-0 z-50 mt-1.5 w-72 origin-top-left rounded-lg border p-1 shadow-lg focus:outline-none">
          <div className="text-muted-foreground border-border/50 border-b px-2.5 py-1.5 text-[11px] font-semibold tracking-wider uppercase">
            Pilih Pawiwahan
          </div>

          <div className="max-h-60 overflow-y-auto py-1">
            {workspaces.map((w) => {
              const isSelected = w.id === currentWorkspaceId;
              return (
                <button
                  key={w.id}
                  onClick={() => {
                    setIsOpen(false);
                    router.push(`/workspace/${w.id}`);
                  }}
                  className={`hover:bg-muted flex w-full items-center justify-between rounded-md px-2.5 py-2 text-left text-xs transition-colors ${
                    isSelected
                      ? "bg-muted text-foreground font-medium"
                      : "text-muted-foreground"
                  }`}
                >
                  <div className="truncate">
                    <p className="text-foreground truncate">{w.coupleNames}</p>
                    <p className="text-muted-foreground text-[10px]">
                      {w.locationRegion || "Bali"} · {getRoleLabel(w.userRole)}
                    </p>
                  </div>
                  {isSelected && (
                    <Check className="text-primary h-4 w-4 shrink-0" />
                  )}
                </button>
              );
            })}

            {/* Demo workspace preview option */}
            {currentWorkspaceId !== "demo" && (
              <button
                onClick={() => {
                  setIsOpen(false);
                  router.push("/workspace/demo");
                }}
                className="text-muted-foreground hover:bg-muted flex w-full items-center justify-between rounded-md px-2.5 py-2 text-left text-xs transition-colors"
              >
                <div className="truncate">
                  <p className="text-foreground">Pawiwahan Demo</p>
                  <p className="text-muted-foreground text-[10px]">
                    Denpasar · Contoh Rencana
                  </p>
                </div>
              </button>
            )}
          </div>

          <div className="border-border/50 space-y-0.5 border-t pt-1">
            <Link
              href="/workspace/new"
              onClick={() => setIsOpen(false)}
              className="hover:text-foreground text-primary hover:bg-muted flex items-center gap-2 rounded-md px-2.5 py-1.5 text-xs transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Buat Pawiwahan Baru</span>
            </Link>
            <Link
              href="/workspaces"
              onClick={() => setIsOpen(false)}
              className="text-muted-foreground hover:text-foreground hover:bg-muted flex items-center gap-2 rounded-md px-2.5 py-1.5 text-xs transition-colors"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span>Daftar Semua Pawiwahan</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
