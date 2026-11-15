"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  CalendarHeart,
  Flower2,
  Wallet,
  LayoutDashboard,
  CheckSquare,
  Store,
  Users,
  Clock,
  History,
  Settings,
  Menu,
  X,
  ChevronDown,
  Plus,
  Check,
  User,
  LogOut,
} from "lucide-react";
import { WorkspaceEntitlementBanner } from "@/features/payments/components/entitlement-banner";
import { signOutAction } from "@/features/auth/actions";
import type { WorkspaceEntitlement } from "@/features/payments/types";
import type {
  WeddingWorkspace,
  WorkspaceRole,
  WorkspaceSummary,
} from "../types";

export interface WorkspaceShellProps {
  workspace: WeddingWorkspace;
  userRole: WorkspaceRole;
  userWorkspaces: WorkspaceSummary[];
  entitlement: WorkspaceEntitlement;
  user: {
    email?: string;
    user_metadata?: { full_name?: string };
  } | null;
  children: React.ReactNode;
}

export function WorkspaceShell({
  workspace,
  userRole,
  userWorkspaces,
  entitlement,
  user,
  children,
}: WorkspaceShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);

  const drawerRef = useRef<HTMLDivElement>(null);
  const switcherRef = useRef<HTMLDivElement>(null);
  const openMenuButtonRef = useRef<HTMLButtonElement>(null);

  const basePath = `/workspace/${workspace.id}`;

  const navItems = [
    {
      label: "Ringkasan",
      href: basePath,
      icon: LayoutDashboard,
      active: pathname === basePath,
    },
    {
      label: "Rencana Upacara",
      href: `${basePath}/ceremonies`,
      icon: CalendarHeart,
      active: pathname.startsWith(`${basePath}/ceremonies`),
    },
    {
      label: "Banten & Sarana",
      href: `${basePath}/banten`,
      icon: Flower2,
      active: pathname.startsWith(`${basePath}/banten`),
    },
    {
      label: "Tugas & Checklist",
      href: `${basePath}/tasks`,
      icon: CheckSquare,
      active: pathname.startsWith(`${basePath}/tasks`),
    },
    {
      label: "Anggaran",
      href: `${basePath}/budget`,
      icon: Wallet,
      active: pathname.startsWith(`${basePath}/budget`),
    },
    {
      label: "Vendor",
      href: `${basePath}/vendors`,
      icon: Store,
      active: pathname.startsWith(`${basePath}/vendors`),
    },
    {
      label: "Tamu",
      href: `${basePath}/guests`,
      icon: Users,
      active: pathname.startsWith(`${basePath}/guests`),
    },
    {
      label: "Rundown",
      href: `${basePath}/rundown`,
      icon: Clock,
      active: pathname.startsWith(`${basePath}/rundown`),
    },
    {
      label: "Riwayat",
      href: `${basePath}/history`,
      icon: History,
      active: pathname.startsWith(`${basePath}/history`),
    },
    {
      label: "Pengaturan",
      href: `${basePath}/settings`,
      icon: Settings,
      active: pathname.startsWith(`${basePath}/settings`),
    },
  ];

  // Handle Escape key and outside click for switcher and drawer
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        if (isSwitcherOpen) {
          setIsSwitcherOpen(false);
        } else if (isDrawerOpen) {
          setIsDrawerOpen(false);
          openMenuButtonRef.current?.focus();
        }
      }
    }

    function handleClickOutside(event: MouseEvent) {
      if (
        switcherRef.current &&
        !switcherRef.current.contains(event.target as Node)
      ) {
        setIsSwitcherOpen(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDrawerOpen, isSwitcherOpen]);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (isDrawerOpen) {
      document.body.style.overflow = "hidden";
      // Auto focus drawer container
      drawerRef.current?.focus();
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isDrawerOpen]);

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

  const getStatusBadge = () => {
    if (workspace.id === "demo") {
      return (
        <span className="rounded border border-amber-500/30 bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-amber-400">
          Demo
        </span>
      );
    }
    if (entitlement.status === "unpaid") {
      return (
        <span className="rounded border border-yellow-500/30 bg-yellow-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-yellow-400">
          Draf
        </span>
      );
    }
    if (entitlement.status === "expired") {
      return (
        <span className="rounded border border-blue-500/30 bg-blue-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-blue-400">
          Arsip
        </span>
      );
    }
    return (
      <span className="rounded border border-emerald-500/30 bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-400">
        Aktif
      </span>
    );
  };

  // Reusable Sidebar content
  const renderSidebarContent = (isMobile = false) => (
    <div className="flex h-full flex-col justify-between">
      <div className="flex flex-col space-y-4">
        {/* Top Branding */}
        <div className="border-zinc-850 flex items-center justify-between border-b px-5 py-4">
          <Link
            href="/"
            className="flex items-center gap-2.5 transition-opacity hover:opacity-90"
            onClick={() => isMobile && setIsDrawerOpen(false)}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-amber-500/40 bg-amber-500/20 text-amber-500">
              <CalendarHeart className="h-4.5 w-4.5" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold tracking-tight text-white">
                Patemon
              </span>
              <span className="text-[10px] font-medium tracking-wider text-zinc-400 uppercase">
                Pawiwahan Planner
              </span>
            </div>
          </Link>

          {isMobile && (
            <button
              type="button"
              onClick={() => setIsDrawerOpen(false)}
              className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-900 hover:text-white"
              aria-label="Tutup menu navigasi"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Workspace Context & Switcher */}
        <div className="relative px-3" ref={switcherRef}>
          <button
            type="button"
            onClick={() => setIsSwitcherOpen(!isSwitcherOpen)}
            className="flex min-h-[44px] w-full items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/90 p-2.5 text-left text-xs transition-colors hover:border-zinc-700 hover:bg-zinc-900"
            aria-expanded={isSwitcherOpen}
            aria-haspopup="true"
            aria-label="Pilih Ruang Kerja Pawiwahan"
          >
            <div className="flex flex-col truncate pr-1">
              <span className="truncate font-semibold text-white">
                {workspace.coupleNames}
              </span>
              <div className="flex items-center gap-1.5 pt-1 text-[11px] text-zinc-400">
                <span className="font-medium">{getRoleLabel(userRole)}</span>
                <span>•</span>
                {getStatusBadge()}
              </div>
            </div>
            <ChevronDown className="h-4 w-4 shrink-0 text-zinc-400" />
          </button>

          {/* Switcher Dropdown */}
          {isSwitcherOpen && (
            <div className="border-zinc-750 absolute top-full right-3 left-3 z-50 mt-1.5 rounded-xl border bg-zinc-900 p-1.5 shadow-2xl">
              <div className="border-b border-zinc-800 px-2 py-1.5 text-[11px] font-semibold tracking-wider text-zinc-400 uppercase">
                Ganti Ruang Kerja
              </div>
              <div className="max-h-56 overflow-y-auto py-1">
                {userWorkspaces.map((w) => {
                  const isSelected = w.id === workspace.id;
                  return (
                    <button
                      key={w.id}
                      type="button"
                      onClick={() => {
                        setIsSwitcherOpen(false);
                        if (isMobile) setIsDrawerOpen(false);
                        router.push(`/workspace/${w.id}`);
                      }}
                      className={`flex min-h-[44px] w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs transition-colors ${
                        isSelected
                          ? "bg-amber-500/15 font-medium text-amber-400"
                          : "text-zinc-300 hover:bg-zinc-800 hover:text-white"
                      }`}
                    >
                      <div className="truncate pr-2">
                        <p className="truncate font-medium">{w.coupleNames}</p>
                        <p className="text-[10px] text-zinc-400 capitalize">
                          {getRoleLabel(w.userRole)}
                        </p>
                      </div>
                      {isSelected && (
                        <Check className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="border-t border-zinc-800 pt-1">
                <Link
                  href="/workspace/new"
                  onClick={() => {
                    setIsSwitcherOpen(false);
                    if (isMobile) setIsDrawerOpen(false);
                  }}
                  className="flex min-h-[44px] w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium text-amber-400 transition-colors hover:bg-zinc-800 hover:text-amber-300"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Buat Ruang Kerja Baru</span>
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* 9 Core Navigation Links */}
        <nav
          className="flex flex-col space-y-1 px-3"
          aria-label="Navigasi Ruang Kerja Pawiwahan"
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => isMobile && setIsDrawerOpen(false)}
                className={`flex min-h-[44px] items-center gap-3 rounded-lg text-xs font-medium transition-colors ${
                  item.active
                    ? "border-l-2 border-amber-500 bg-amber-500/10 pl-3.5 text-amber-400"
                    : "pl-4 text-zinc-400 hover:bg-zinc-900/80 hover:text-zinc-100"
                }`}
                aria-current={item.active ? "page" : undefined}
              >
                <Icon
                  className={`h-4.5 w-4.5 shrink-0 ${
                    item.active ? "text-amber-500" : "text-zinc-400"
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Profile & Utilities */}
      <div className="border-zinc-850 border-t p-3">
        <div className="flex items-center justify-between rounded-xl bg-zinc-900/60 p-2.5">
          <Link
            href="/profile"
            onClick={() => isMobile && setIsDrawerOpen(false)}
            className="flex min-h-[44px] items-center gap-2.5 truncate text-left transition-opacity hover:opacity-80"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-800 text-zinc-300">
              <User className="h-4 w-4" />
            </div>
            <div className="flex flex-col truncate">
              <span className="truncate text-xs font-medium text-zinc-200">
                {user?.user_metadata?.full_name ||
                  user?.email?.split("@")[0] ||
                  "Profil Akun"}
              </span>
              <span className="truncate text-[10px] text-zinc-400">
                {user?.email || "Lihat Profil"}
              </span>
            </div>
          </Link>

          <form action={signOutAction}>
            <button
              type="submit"
              className="hover:text-destructive flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-800"
              title="Keluar dari Akun"
              aria-label="Keluar dari Akun"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Skip to Main Content Link (Accessibility) */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-md focus:bg-amber-600 focus:px-3 focus:py-2 focus:text-white focus:shadow-md"
      >
        Loncat ke konten utama
      </a>

      {/* Mobile Top Header (<1024px, 60px height) */}
      <header className="sticky top-0 z-40 flex h-[60px] items-center justify-between border-b border-zinc-800 bg-zinc-950 px-4 text-white lg:hidden">
        <div className="flex items-center gap-2 truncate">
          <button
            ref={openMenuButtonRef}
            type="button"
            onClick={() => setIsDrawerOpen(true)}
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-zinc-300 hover:bg-zinc-900 hover:text-white"
            aria-label="Buka menu navigasi"
            aria-expanded={isDrawerOpen}
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="flex flex-col truncate">
            <span className="truncate text-xs font-bold text-white">
              {workspace.coupleNames}
            </span>
            <span className="text-[10px] text-zinc-400">
              {getRoleLabel(userRole)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {getStatusBadge()}
          <Link
            href="/profile"
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-zinc-300 hover:bg-zinc-900 hover:text-white"
            aria-label="Profil Akun"
          >
            <User className="h-4.5 w-4.5" />
          </Link>
        </div>
      </header>

      {/* Mobile Drawer Backdrop & Panel */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="animate-in fade-in fixed inset-0 bg-black/75 backdrop-blur-xs transition-opacity duration-200"
            onClick={() => setIsDrawerOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer Menu */}
          <div
            ref={drawerRef}
            tabIndex={-1}
            className="animate-in slide-in-from-left fixed inset-y-0 left-0 z-50 flex w-[270px] flex-col bg-zinc-950 text-zinc-100 shadow-2xl duration-200 focus:outline-none"
            role="dialog"
            aria-modal="true"
            aria-label="Menu Navigasi Ruang Kerja"
          >
            {renderSidebarContent(true)}
          </div>
        </div>
      )}

      {/* Desktop Fixed Sidebar (270px) */}
      <aside className="border-zinc-850 fixed inset-y-0 left-0 z-30 hidden w-[270px] border-r bg-zinc-950 text-zinc-100 lg:flex lg:flex-col">
        {renderSidebarContent(false)}
      </aside>

      {/* Desktop Content Canvas (Metronic Demo 10 Style) */}
      <div className="min-h-screen lg:pl-[270px]">
        <div className="bg-background text-foreground border-border/40 flex min-h-screen flex-col shadow-sm lg:rounded-tl-2xl lg:rounded-bl-2xl lg:border-l">
          {/* Entitlement Banner if workspace is unpaid, expiring, demo, or expired */}
          {entitlement && (
            <WorkspaceEntitlementBanner
              entitlement={entitlement}
              weddingId={workspace.id}
              coupleNames={workspace.coupleNames}
            />
          )}

          {/* Main workspace content area */}
          <main id="main-content" className="w-full flex-1 overflow-x-hidden">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
