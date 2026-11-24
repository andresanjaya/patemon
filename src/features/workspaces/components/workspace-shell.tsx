"use client";
import { Button } from "@/components/ui/button";

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
  ShieldCheck,
} from "lucide-react";
import { WorkspaceEntitlementBanner } from "@/features/payments/components/entitlement-banner";
import { signOutAction } from "@/features/auth/actions";
import { WorkspaceProvider } from "../context/workspace-context";
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
  isAdmin?: boolean;
  children: React.ReactNode;
}

function getInitials(name: string): string {
  if (!name) return "PW";
  const parts = name
    .split(/&|\band\b|\+/i)
    .map((s) => s.trim())
    .filter(Boolean);
  if (parts.length >= 2) {
    const first = parts[0][0]?.toUpperCase() || "P";
    const second = parts[1][0]?.toUpperCase() || "W";
    return `${first}·${second}`;
  }
  return name.slice(0, 2).toUpperCase() || "PW";
}

function getUserInitials(name?: string, email?: string): string {
  if (name) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }
  if (email) {
    return email.slice(0, 2).toUpperCase();
  }
  return "AA";
}

export function WorkspaceShell({
  workspace,
  userRole,
  userWorkspaces,
  entitlement,
  user,
  isAdmin = false,
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

  const userName =
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    "Pemilik Workspace";
  const userInitials = getUserInitials(
    user?.user_metadata?.full_name,
    user?.email
  );

  // Reusable Sidebar content (Metronic Demo 10 Parity)
  const renderSidebarContent = (isMobile = false) => (
    <div className="flex h-full flex-col justify-between overflow-y-auto px-[15px] pt-6 pb-[18px]">
      <div className="flex flex-col">
        {/* Top Branding (Lotus icon mark in box + Patemon WORKSPACE) */}
        <div className="flex items-center justify-between pb-1">
          <Link
            href={basePath}
            className="flex items-center gap-[11px] px-[9px] text-[21px] font-[650] tracking-[-0.7px] text-white hover:opacity-95"
            onClick={() => isMobile && setIsDrawerOpen(false)}
          >
            <div className="flex h-[33px] w-[33px] shrink-0 items-center justify-center rounded-[10px] border border-[#4c4434] bg-[#27231d] text-[#edc27b]">
              <Flower2 className="h-[21px] w-[21px]" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-white">Patemon</span>
            </div>
          </Link>

          {isMobile && (
            <Button
              variant="ghost"
              size={null}
              type="button"
              onClick={() => setIsDrawerOpen(false)}
              className="min-h-[44px] min-w-[44px] rounded-lg"
              aria-label="Tutup menu navigasi"
            >
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>

        {/* Workspace Context & Switcher */}
        <div className="relative mt-[25px] mb-[22px]" ref={switcherRef}>
          <Button
            variant="ghost"
            size={null}
            type="button"
            onClick={() => setIsSwitcherOpen(!isSwitcherOpen)}
            className="min-h-[44px] w-full justify-between rounded-lg border p-3 text-left"
            aria-expanded={isSwitcherOpen}
            aria-haspopup="true"
            aria-label="Pilih Ruang Kerja Pawiwahan"
          >
            <div className="flex items-center gap-2.5 truncate">
              <div className="flex h-[33px] w-[33px] shrink-0 items-center justify-center rounded-[7px] bg-[#353029] text-xs font-semibold text-[#efcd99]">
                {getInitials(workspace.coupleNames)}
              </div>
              <div className="flex flex-col truncate">
                <span className="truncate text-xs font-semibold text-white">
                  {workspace.coupleNames}
                </span>
                <div className="flex items-center gap-1.5 pt-0.5 text-[10px] text-[#a4a4ad]">
                  <span className="truncate">
                    {workspace.locationRegion
                      ? `Pawiwahan · ${workspace.locationRegion}`
                      : "Pawiwahan Bali"}
                  </span>
                </div>
              </div>
            </div>
            <ChevronDown className="h-4 w-4 shrink-0 text-[#8a8a94]" />
          </Button>

          {/* Switcher Dropdown */}
          {isSwitcherOpen && (
            <div className="absolute top-full right-0 left-0 z-50 mt-1.5 rounded-xl border border-[#303034] bg-[#1b1b1e] p-1.5 shadow-2xl">
              <div className="border-b border-[#303034] px-2.5 py-1.5 text-[10px] font-semibold tracking-wider text-[#96969f] uppercase">
                Ganti Ruang Kerja
              </div>
              <div className="max-h-56 overflow-y-auto py-1">
                {userWorkspaces.map((w) => {
                  const isSelected = w.id === workspace.id;
                  return (
                    <Button
                      variant="ghost"
                      size={null}
                      key={w.id}
                      type="button"
                      onClick={() => {
                        setIsSwitcherOpen(false);
                        if (isMobile) setIsDrawerOpen(false);
                        router.push(`/workspace/${w.id}`);
                      }}
                      className={`flex min-h-[44px] w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs transition-colors ${
                        isSelected
                          ? "bg-[#353029] font-medium text-[#efcd99]"
                          : "text-zinc-300 hover:bg-[#252528] hover:text-white"
                      }`}
                    >
                      <div className="truncate pr-2">
                        <p className="truncate font-medium">{w.coupleNames}</p>
                        <p className="text-[10px] text-[#a4a4ad] capitalize">
                          {getRoleLabel(w.userRole)}
                        </p>
                      </div>
                      {isSelected && (
                        <Check className="h-3.5 w-3.5 shrink-0 text-[#efcd99]" />
                      )}
                    </Button>
                  );
                })}
              </div>

              <div className="border-t border-[#303034] pt-1">
                <Link
                  href="/workspace/new"
                  onClick={() => {
                    setIsSwitcherOpen(false);
                    if (isMobile) setIsDrawerOpen(false);
                  }}
                  className="flex min-h-[44px] w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium text-[#edc27b] transition-colors hover:bg-[#252528] hover:text-white"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Buat Ruang Kerja Baru</span>
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Section Label */}
        <p className="sidebar-label mb-2 px-3 text-[10px] font-medium tracking-[0.1em] text-[#96969f] uppercase">
          PERENCANAAN
        </p>

        {/* 9 Core Navigation Links */}
        <nav
          className="flex flex-col space-y-1"
          aria-label="Navigasi Ruang Kerja Pawiwahan"
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => isMobile && setIsDrawerOpen(false)}
                className={`flex min-h-[44px] items-center gap-[11px] rounded-[6px] px-3 py-2 text-xs font-medium transition-colors lg:min-h-[40px] ${
                  item.active
                    ? "bg-[#28282b] text-white"
                    : "text-[#c4c4ce] hover:bg-[#252528] hover:text-white"
                }`}
                aria-current={item.active ? "page" : undefined}
              >
                <Icon
                  className={`h-[18px] w-[18px] shrink-0 ${
                    item.active ? "text-[#edc27b]" : "text-[#8a8a94]"
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}

          {isAdmin && (
            <div className="pt-2">
              <Link
                href="/admin"
                onClick={() => isMobile && setIsDrawerOpen(false)}
                className="flex min-h-[44px] items-center gap-[11px] rounded-[6px] border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-300 transition-colors hover:bg-amber-500/20 lg:min-h-[40px]"
              >
                <ShieldCheck className="h-[18px] w-[18px] shrink-0 text-amber-400" />
                <span className="truncate">Master Admin Panel</span>
              </Link>
            </div>
          )}
        </nav>
      </div>

      {/* Sidebar Bottom (Balinese Wisdom & User Profile) */}
      <div className="mt-auto pt-6">
        {/* Balinese Guidance Box */}
        <div className="rounded-[8px] border border-dashed border-[#46414b] p-[14px] text-[11px] text-[#aaaab4]">
          <strong className="mb-1 block font-medium text-[#dedee5]">
            Desa, kala, patra.
          </strong>
          Rencana mengikuti kesepakatan keluarga dan arahan praktisi setempat.
        </div>

        {/* Divider */}
        <div className="my-4 h-[1px] bg-[#2b2b30]" />

        {/* User Profile Footer */}
        <div className="flex items-center gap-2.5">
          <Link
            href="/profile"
            onClick={() => isMobile && setIsDrawerOpen(false)}
            className="flex min-h-[44px] flex-1 items-center gap-2.5 truncate transition-opacity hover:opacity-90"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#e8dbcb] text-[11px] font-semibold text-[#64513d]">
              {userInitials}
            </div>
            <div className="flex flex-col truncate">
              <strong className="truncate text-xs font-medium text-white">
                {userName}
              </strong>
              <div className="truncate text-[10px] text-[#9797a1]">
                {getRoleLabel(userRole)} · {user?.email || "Akun"}
              </div>
            </div>
          </Link>

          <span
            className="h-[7px] w-[7px] shrink-0 rounded-full bg-[#70b189]"
            aria-hidden="true"
            title="Online"
          />

          <form action={signOutAction} className="ml-1">
            <Button
              variant="ghost"
              size={null}
              type="submit"
              className="min-h-[44px] min-w-[36px] rounded-lg"
              title="Keluar dari Akun"
              aria-label="Keluar dari Akun"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );

  return (
    <WorkspaceProvider
      workspace={workspace}
      userRole={userRole}
      entitlement={entitlement}
    >
      <div className="workspace-shell min-h-screen bg-[#101012] bg-zinc-950 font-sans text-zinc-100">
        {/* Skip to Main Content Link (Accessibility) */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-md focus:bg-amber-600 focus:px-3 focus:py-2 focus:text-white focus:shadow-md"
        >
          Loncat ke konten utama
        </a>

        {/* Mobile Top Header (<1024px, 60px height) */}
        <header className="dark sticky top-0 z-40 flex h-[60px] items-center justify-between border-b border-[#303034] bg-[#101012] px-4 text-white lg:hidden">
          <div className="flex items-center gap-2.5 truncate">
            <Button
              variant="ghost"
              size={null}
              ref={openMenuButtonRef}
              type="button"
              onClick={() => setIsDrawerOpen(true)}
              className="min-h-[44px] min-w-[44px] rounded-lg"
              aria-label="Buka menu navigasi"
              aria-expanded={isDrawerOpen}
            >
              <Menu className="h-5 w-5" />
            </Button>

            <div className="flex flex-col truncate">
              <span className="truncate text-xs font-bold text-white">
                {workspace.coupleNames}
              </span>
              <span className="text-[10px] text-[#a4a4ad]">
                {getRoleLabel(userRole)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/profile"
              className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-[#c4c4ce] hover:bg-[#252528] hover:text-white"
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
              className="dark animate-in slide-in-from-left fixed inset-y-0 left-0 z-50 flex w-[270px] flex-col bg-[#101012] text-zinc-100 shadow-2xl duration-200 focus:outline-none"
              role="dialog"
              aria-modal="true"
              aria-label="Menu Navigasi Ruang Kerja"
            >
              {renderSidebarContent(true)}
            </div>
          </div>
        )}

        {/* Desktop Fixed Sidebar (270px) */}
        <aside className="dark fixed inset-y-0 left-0 z-30 hidden w-[270px] border-r border-[#202024] bg-[#101012] bg-zinc-950 text-zinc-100 lg:flex lg:flex-col">
          {renderSidebarContent(false)}
        </aside>

        {/* Desktop Content Canvas (Metronic Demo 10 Style) */}
        <div className="min-h-screen lg:pl-[270px]">
          <div className="workspace-canvas flex min-h-screen flex-col border-[#e5e5e9] bg-white text-[#18181b] shadow-sm lg:rounded-tl-2xl lg:rounded-bl-2xl lg:border-l">
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
    </WorkspaceProvider>
  );
}
